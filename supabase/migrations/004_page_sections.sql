-- Migration 004: page content. Run after 003, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- A page's content is an ordered list of sections. Each section has a type, which names one
-- of the section designs in the site's files (src/sections/), and its content: the values
-- the editor filled in, in whatever shape that type needs.

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  -- Deleting a page deletes its sections with it.
  page_id uuid not null references public.pages (id) on delete cascade,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index page_sections_page_id_position_idx on public.page_sections (page_id, position);

alter table public.page_sections enable row level security;

grant select on public.page_sections to anon;
grant select, insert, update, delete on public.page_sections to authenticated;

-- Visitors can only read the sections of published pages.
create policy "Anyone can read sections of published pages"
  on public.page_sections for select
  to anon
  using (
    exists (
      select 1 from public.pages
      where pages.id = page_sections.page_id and pages.published
    )
  );

create policy "Logged-in users manage sections"
  on public.page_sections for all
  to authenticated
  using (true)
  with check (true);
