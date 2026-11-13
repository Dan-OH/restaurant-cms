-- Migration 002: page groups. Run in the Supabase dashboard: SQL Editor > New query > Run.
--
-- A group is a row in the pages table with kind = 'group'. It has a name (title) but no
-- slug, and pages or other groups are placed inside it by pointing their parent_id at it.

alter table public.pages
  add column kind text not null default 'page' check (kind in ('page', 'group')),
  -- "restrict" so a group can never be deleted while it still has pages inside it;
  -- the admin moves the contents out before deleting a group.
  add column parent_id uuid references public.pages (id) on delete restrict,
  alter column slug drop not null,
  -- Pages must have a slug, groups must not.
  add constraint pages_slug_matches_kind check ((kind = 'page') = (slug is not null)),
  add constraint pages_not_own_parent check (parent_id <> id);

create index pages_parent_id_idx on public.pages (parent_id);
