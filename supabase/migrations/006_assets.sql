-- Migration 006: the asset list. Run after 005, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- Keeps a record of every uploaded image, for the Assets page of the admin dashboard.
-- An asset is one uploaded file (the original). Each time it is cropped, a crop is added:
-- the shape it was cropped to, which part of the original was kept, and the resulting file.
-- The files themselves stay in the site-images bucket (migration 005); page content still
-- refers to them by their storage paths.

create table public.assets (
  -- The asset's folder in the site-images bucket.
  id uuid primary key,
  original_path text not null unique,
  file_name text,
  mime_type text,
  size_bytes bigint,
  -- Size of the original in pixels. Unknown for images uploaded before this migration.
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table public.asset_crops (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  path text not null unique,
  -- One of the shapes in src/sections/imagePresets.js.
  preset text,
  -- The part of the original that was kept: { x, y, width, height } in the original's pixels.
  area jsonb,
  -- Size of the saved crop in pixels.
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index asset_crops_asset_id_idx on public.asset_crops (asset_id);

alter table public.assets enable row level security;
alter table public.asset_crops enable row level security;

-- Only the admin uses these; visitors get images straight from the bucket.
grant select, insert, update, delete on public.assets to authenticated;
grant select, insert, update, delete on public.asset_crops to authenticated;

create policy "Logged-in users manage assets"
  on public.assets for all
  to authenticated
  using (true)
  with check (true);

create policy "Logged-in users manage asset crops"
  on public.asset_crops for all
  to authenticated
  using (true)
  with check (true);

-- Records the images that were uploaded before this migration. Their pixel sizes and crop
-- areas were never stored, so those are left empty; a crop's shape is taken from the page
-- section that shows it, where there is one.
insert into public.assets (id, original_path, file_name, mime_type, size_bytes, created_at)
select
  split_part(name, '/', 1)::uuid,
  name,
  split_part(name, '/', 2),
  metadata ->> 'mimetype',
  (metadata ->> 'size')::bigint,
  created_at
from storage.objects
where bucket_id = 'site-images'
  and name ~ '^[0-9a-f-]{36}/original\.[^/]+$'
on conflict do nothing;

insert into public.asset_crops (asset_id, path, preset, created_at)
select distinct on (o.name)
  a.id,
  o.name,
  s.content ->> 'preset',
  o.created_at
from storage.objects o
join public.assets a on a.id::text = split_part(o.name, '/', 1)
left join public.page_sections s on s.content ->> 'cropped' = o.name
where o.bucket_id = 'site-images'
  and o.name ~ '^[0-9a-f-]{36}/cropped-[^/]+$'
on conflict do nothing;
