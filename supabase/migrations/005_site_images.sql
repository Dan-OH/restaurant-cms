-- Migration 005: image uploads. Run after 004, in the Supabase dashboard:
-- SQL Editor > New query > Run.
--
-- Creates the storage bucket that uploaded images are kept in. For each image the site
-- stores the original file and the cropped version that is actually shown.
--
-- The bucket is public, meaning anyone with an image's address can view it (which is what
-- lets visitors see the images). Only logged-in users can upload, replace or delete.

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "Logged-in users can view site images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'site-images');

create policy "Logged-in users can upload site images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images');

create policy "Logged-in users can replace site images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');

create policy "Logged-in users can delete site images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images');
