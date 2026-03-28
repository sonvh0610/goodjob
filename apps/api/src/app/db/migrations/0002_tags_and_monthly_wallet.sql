create table if not exists core_tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(40) not null,
  normalized_name varchar(40) not null unique,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists core_tags_name_idx on core_tags(name);

create table if not exists kudo_core_tags (
  kudo_id uuid not null references kudos(id) on delete cascade,
  core_tag_id uuid not null references core_tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (kudo_id, core_tag_id)
);
create index if not exists kudo_core_tags_tag_idx on kudo_core_tags(core_tag_id);

create table if not exists monthly_giving_wallets (
  user_id uuid not null references users(id) on delete cascade,
  month_key varchar(7) not null,
  spent_points integer not null default 0,
  limit_points integer not null default 200,
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);
create index if not exists monthly_giving_wallets_user_month_idx
  on monthly_giving_wallets(user_id, month_key);

insert into core_tags(name, normalized_name)
values
  ('#Teamwork', 'teamwork'),
  ('#Ownership', 'ownership'),
  ('#Innovation', 'innovation'),
  ('#Impact', 'impact')
on conflict (normalized_name) do nothing;

insert into core_tags(name, normalized_name)
select distinct
  case when trim(core_value) like '#%' then trim(core_value) else '#' || trim(core_value) end,
  regexp_replace(lower(trim(core_value)), '[^a-z0-9]+', '', 'g')
from kudos
where trim(core_value) <> ''
on conflict (normalized_name) do nothing;

insert into kudo_core_tags(kudo_id, core_tag_id)
select k.id, t.id
from kudos k
join core_tags t
  on t.normalized_name = regexp_replace(lower(trim(k.core_value)), '[^a-z0-9]+', '', 'g')
on conflict do nothing;

insert into monthly_giving_wallets(user_id, month_key, spent_points, limit_points)
select
  b.user_id,
  b.month_key,
  abs(least(coalesce(sum(b.delta_points), 0), 0))::int as spent_points,
  200 as limit_points
from budget_ledger b
group by b.user_id, b.month_key
on conflict (user_id, month_key) do update
set spent_points = excluded.spent_points,
    updated_at = now();
