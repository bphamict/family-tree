-- Family tree persons (genealogy members).
-- See docs/DATABASE_DESIGN.md

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  branch_id uuid,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text check (gender in ('male', 'female', 'other', 'unknown')),
  birth_date date,
  death_date date,
  biography text,
  occupation text,
  avatar_url text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint persons_death_after_birth check (
    death_date is null or birth_date is null or death_date >= birth_date
  )
);

create index persons_family_id_idx on public.persons (family_id);
create index persons_branch_id_idx on public.persons (branch_id);
create index persons_last_name_idx on public.persons (last_name);
create index persons_birth_date_idx on public.persons (birth_date);
create index persons_archived_at_idx on public.persons (archived_at);

create trigger persons_updated_at
  before update on public.persons
  for each row
  execute function public.handle_updated_at();

alter table public.persons enable row level security;

create policy "Family members can view persons"
  on public.persons
  for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors and above can create persons"
  on public.persons
  for insert
  to authenticated
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

create policy "Editors and above can update persons"
  on public.persons
  for update
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  )
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

-- Person avatars storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'person-avatars',
  'person-avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Family members can view person avatars"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'person-avatars'
    and public.is_family_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Editors and above can upload person avatars"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'person-avatars'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );

create policy "Editors and above can update person avatars"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'person-avatars'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );

create policy "Editors and above can delete person avatars"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'person-avatars'
    and public.has_family_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner', 'admin', 'editor']
    )
  );
