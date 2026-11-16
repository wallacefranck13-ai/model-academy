-- MODEL ACADEMY: create a private bucket for model training videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'model-training',
  'model-training',
  false,
  41943040,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = 41943040,
    allowed_mime_types = excluded.allowed_mime_types;

-- Each authenticated user may upload/read/delete only files in their own folder.
create policy "model training owner upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'model-training'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "model training owner read"
on storage.objects for select to authenticated
using (
  bucket_id = 'model-training'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "model training owner delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'model-training'
  and (storage.foldername(name))[1] = auth.uid()::text
);
