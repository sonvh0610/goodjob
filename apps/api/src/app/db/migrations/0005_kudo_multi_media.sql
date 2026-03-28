create table if not exists kudo_media_assets (
  kudo_id uuid not null references kudos(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (kudo_id, media_asset_id)
);

create index if not exists kudo_media_assets_kudo_position_idx
  on kudo_media_assets(kudo_id, position);

insert into kudo_media_assets(kudo_id, media_asset_id, position)
select id, media_asset_id, 0
from kudos
where media_asset_id is not null
on conflict do nothing;
