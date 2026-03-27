create extension if not exists pgcrypto;

create type media_type as enum ('image','video');
create type media_status as enum ('pending','validated','rejected');
create type feed_event_type as enum ('kudo_created','reaction_added','comment_added');
create type point_direction as enum ('credit','debit');
create type redemption_status as enum ('pending','approved','rejected');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(320) not null unique,
  display_name varchar(100) not null,
  password_hash varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider varchar(50) not null,
  provider_account_id varchar(255) not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(255) not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions(user_id);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(255) not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_user_idx on password_reset_tokens(user_id);

create table if not exists wallets (
  user_id uuid primary key references users(id) on delete cascade,
  available_points integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists budget_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month_key varchar(7) not null,
  delta_points integer not null,
  reason varchar(100) not null,
  ref_type varchar(40) not null,
  ref_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists budget_ledger_user_month_idx on budget_ledger(user_id, month_key);

create table if not exists point_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  delta_points integer not null,
  direction point_direction not null,
  reason varchar(100) not null,
  ref_type varchar(40) not null,
  ref_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists point_ledger_user_idx on point_ledger(user_id);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  media_type media_type not null,
  status media_status not null default 'pending',
  mime_type varchar(100) not null,
  file_size_bytes bigint not null,
  duration_seconds integer,
  storage_key varchar(500) not null,
  public_url varchar(1000),
  created_at timestamptz not null default now()
);
create index if not exists media_assets_owner_idx on media_assets(owner_id);

create table if not exists kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete restrict,
  receiver_id uuid not null references users(id) on delete restrict,
  points integer not null,
  description text not null,
  core_value varchar(60) not null,
  media_asset_id uuid references media_assets(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists kudos_created_at_idx on kudos(created_at desc, id desc);

create table if not exists kudo_tagged_users (
  kudo_id uuid not null references kudos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (kudo_id, user_id)
);

create table if not exists feed_events (
  id uuid primary key default gen_random_uuid(),
  kudo_id uuid not null references kudos(id) on delete cascade,
  actor_id uuid not null references users(id) on delete restrict,
  type feed_event_type not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists feed_events_created_at_idx on feed_events(created_at desc, id desc);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  kudo_id uuid not null references kudos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji varchar(16) not null,
  created_at timestamptz not null default now(),
  unique (kudo_id, user_id, emoji)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  kudo_id uuid not null references kudos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  media_asset_id uuid references media_assets(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  name varchar(140) not null,
  cost_points integer not null,
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists rewards_active_idx on rewards(active);

create table if not exists redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete restrict,
  cost_points integer not null,
  status redemption_status not null default 'approved',
  idempotency_key varchar(128) not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type varchar(40) not null,
  payload_json jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_read_idx on notifications(user_id, created_at desc, read_at);

insert into rewards(name, cost_points, stock, active)
values
  ('Amazon Gift Card $25', 250, 100, true),
  ('Spotify Premium 1 month', 180, 150, true),
  ('Goodjob Swag Pack', 120, 200, true)
on conflict do nothing;
