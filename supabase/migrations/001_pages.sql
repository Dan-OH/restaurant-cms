-- Migration 001: the pages table. Run in the Supabase dashboard: SQL Editor > New query > Run.

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  published boolean not null default true,
  show_in_nav boolean not null default true,
  nav_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pages enable row level security;

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;

-- Visitors can only read published pages.
create policy "Anyone can read published pages"
  on public.pages for select
  to anon
  using (published);

-- Anyone who is logged in is a CMS editor and can do everything.
-- Keep public sign-ups disabled in Supabase so only invited users can log in.
create policy "Logged-in users manage pages"
  on public.pages for all
  to authenticated
  using (true)
  with check (true);

-- The page with the slug "home" is shown at the site root (/).
insert into public.pages (title, slug, nav_order) values ('Home', 'home', 0);
