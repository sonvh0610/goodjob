import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pgPool } from './client.js';

async function ensureMigrationsTable() {
  await pgPool.query(`
    create table if not exists schema_migrations (
      id serial primary key,
      name varchar(255) not null unique,
      executed_at timestamptz not null default now()
    )
  `);
}

async function run() {
  const migrationsDirCandidates = [
    path.resolve(__dirname, 'migrations'),
    // Nx esbuild assets may be emitted under dist/src/... while JS lives in
    // dist/apps/api/src/..., so keep a fallback for production bundles.
    path.resolve(__dirname, '../../../../../src/app/db/migrations'),
  ];

  let migrationsDir: string | null = null;
  for (const candidate of migrationsDirCandidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        migrationsDir = candidate;
        break;
      }
    } catch {
      // Keep trying the next candidate.
    }
  }

  if (!migrationsDir) {
    throw new Error(
      `Unable to locate migrations directory. Tried: ${migrationsDirCandidates.join(
        ', '
      )}`
    );
  }

  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  await ensureMigrationsTable();
  for (const fileName of files) {
    const exists = await pgPool.query(
      'select 1 from schema_migrations where name = $1 limit 1',
      [fileName]
    );
    if (exists.rowCount && exists.rowCount > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, fileName), 'utf-8');
    await pgPool.query('begin');
    try {
      await pgPool.query(sql);
      await pgPool.query('insert into schema_migrations(name) values ($1)', [
        fileName,
      ]);
      await pgPool.query('commit');
      console.log(`Applied migration ${fileName}`);
    } catch (error) {
      await pgPool.query('rollback');
      throw error;
    }
  }
}

run()
  .then(async () => {
    await pgPool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await pgPool.end();
    process.exit(1);
  });
