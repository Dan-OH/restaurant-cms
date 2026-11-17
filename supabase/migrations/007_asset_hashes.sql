-- Migration 007: recognising re-uploads. Run after 006, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- Stores a fingerprint (SHA-256) of each original file. When an image is uploaded that is
-- byte-for-byte the same as an existing asset, the site reuses that asset instead of storing
-- the file again, so one asset can have several crops used in several places.
--
-- Images uploaded before this migration get their fingerprint the first time a file of the
-- same size is uploaded (see uploadOriginal in src/lib/images.js).

alter table public.assets add column content_hash text;

create unique index assets_content_hash_idx on public.assets (content_hash) where content_hash is not null;
