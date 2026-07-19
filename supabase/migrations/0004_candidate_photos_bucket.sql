insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-photos',
  'candidate-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Candidate photos are publicly readable" on storage.objects;
create policy "Candidate photos are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'candidate-photos');

drop policy if exists "Authenticated users can upload candidate photos" on storage.objects;
create policy "Authenticated users can upload candidate photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'candidate-photos');

drop policy if exists "Authenticated users can update candidate photos" on storage.objects;
create policy "Authenticated users can update candidate photos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'candidate-photos')
  with check (bucket_id = 'candidate-photos');

drop policy if exists "Authenticated users can delete candidate photos" on storage.objects;
create policy "Authenticated users can delete candidate photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'candidate-photos');
