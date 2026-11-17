-- Migration 008: image descriptions (alt text). Run after 007, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- Each image has one description, read out by screen readers in place of the image. It is
-- kept on the asset and copied into every page section that shows the image (the sections'
-- `alt` value is what the site uses), so changing it in one place changes it everywhere.

alter table public.assets add column alt text not null default '';

-- Fill it in from the sections that already show each image, where they have one.
update public.assets a
set alt = s.alt
from (
  select distinct on (split_part(content ->> 'cropped', '/', 1))
    split_part(content ->> 'cropped', '/', 1) as asset_id,
    content ->> 'alt' as alt
  from public.page_sections
  where coalesce(trim(content ->> 'alt'), '') <> ''
    and content ->> 'cropped' is not null
  order by split_part(content ->> 'cropped', '/', 1), created_at
) s
where a.id::text = s.asset_id;
