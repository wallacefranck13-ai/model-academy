-- MODEL ACADEMY: private portfolio image bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('model-portfolio', 'model-portfolio', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = 8388608,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "portfolio owner upload"
on storage.objects for insert to authenticated
with check (bucket_id = 'model-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio owner read"
on storage.objects for select to authenticated
using (bucket_id = 'model-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio owner delete"
on storage.objects for delete to authenticated
using (bucket_id = 'model-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
