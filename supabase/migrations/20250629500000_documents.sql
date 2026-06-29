-- Family documents and media archive.
-- See docs/DATABASE_DESIGN.md

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  description text,
  document_type text not null check (
    document_type in ('image', 'pdf', 'video', 'other')
  ),
  mime_type text not null,
  file_url text not null,
  storage_path text not null,
  file_size bigint not null default 0,
  person_id uuid references public.persons (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_family_id_idx on public.documents (family_id);
create index documents_person_id_idx on public.documents (person_id);
create index documents_event_id_idx on public.documents (event_id);
create index documents_document_type_idx on public.documents (document_type);
create index documents_created_at_idx on public.documents (created_at desc);

create trigger documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

alter table public.documents enable row level security;

create policy "Family members can view documents"
  on public.documents
  for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors and above can upload documents"
  on public.documents
  for insert
  to authenticated
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
    and uploaded_by = auth.uid()
    and (
      person_id is null
      or exists (
        select 1
        from public.persons as p
        where p.id = documents.person_id
          and p.family_id = documents.family_id
      )
    )
    and (
      event_id is null
      or exists (
        select 1
        from public.events as e
        where e.id = documents.event_id
          and e.family_id = documents.family_id
      )
    )
  );

create policy "Editors and above can update documents"
  on public.documents
  for update
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  )
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
    and (
      person_id is null
      or exists (
        select 1
        from public.persons as p
        where p.id = documents.person_id
          and p.family_id = documents.family_id
      )
    )
    and (
      event_id is null
      or exists (
        select 1
        from public.events as e
        where e.id = documents.event_id
          and e.family_id = documents.family_id
      )
    )
  );

create policy "Editors and above can delete documents"
  on public.documents
  for delete
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

-- Family documents storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'family-documents',
  'family-documents',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do nothing;

create policy "Family members can view family documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'family-documents'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Editors and above can upload family documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'family-documents'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );

create policy "Editors and above can update family documents"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'family-documents'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );

create policy "Editors and above can delete family documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'family-documents'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );
