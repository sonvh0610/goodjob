create table if not exists comment_media_assets (
  comment_id uuid not null references comments(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (comment_id, media_asset_id)
);

create index if not exists comment_media_assets_comment_position_idx
  on comment_media_assets(comment_id, position);

insert into comment_media_assets(comment_id, media_asset_id, position)
select id, media_asset_id, 0
from comments
where media_asset_id is not null
on conflict do nothing;
