-- Migration 003: groups become part of the URL. Run after 002, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- Groups now have a slug like pages do, and a page's address is built from the slugs of
-- the groups it sits in: a page "lunch" in the group "menus" lives at /menus/lunch.
-- Slugs therefore only need to be unique among items in the same place, not site-wide.

begin;

alter table public.pages drop constraint pages_slug_matches_kind;

-- Give any groups created before this migration a slug made from their name.
update public.pages
set slug = coalesce(nullif(trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')), ''), 'group')
where slug is null;

-- If that produced the same slug twice in one place, make the later ones unique.
update public.pages p
set slug = p.slug || '-' || left(p.id::text, 8)
where exists (
  select 1
  from public.pages other
  where other.parent_id is not distinct from p.parent_id
    and other.slug = p.slug
    and other.id < p.id
);

alter table public.pages alter column slug set not null;

-- Replace "unique across the whole site" with "unique within the same parent".
-- "nulls not distinct" makes the rule apply to the top level (parent_id is null) too.
alter table public.pages drop constraint pages_slug_key;
alter table public.pages
  add constraint pages_parent_slug_key unique nulls not distinct (parent_id, slug);

commit;
