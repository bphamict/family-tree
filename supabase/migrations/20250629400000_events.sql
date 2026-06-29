-- Family events and participant links.
-- See docs/DATABASE_DESIGN.md

create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  description text,
  event_type text not null check (
    event_type in ('birth', 'death', 'wedding', 'memorial', 'reunion', 'other')
  ),
  event_date date not null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, person_id)
);

create index events_family_id_idx on public.events (family_id);
create index events_event_date_idx on public.events (event_date);
create index events_event_type_idx on public.events (event_type);
create index event_members_event_id_idx on public.event_members (event_id);
create index event_members_person_id_idx on public.event_members (person_id);

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();

alter table public.events enable row level security;
alter table public.event_members enable row level security;

create policy "Family members can view events"
  on public.events
  for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Editors and above can create events"
  on public.events
  for insert
  to authenticated
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

create policy "Editors and above can update events"
  on public.events
  for update
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  )
  with check (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

create policy "Editors and above can delete events"
  on public.events
  for delete
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin', 'editor'])
  );

create policy "Family members can view event participants"
  on public.event_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events as e
      where e.id = event_members.event_id
        and public.is_family_member(e.family_id)
    )
  );

create policy "Editors and above can add event participants"
  on public.event_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.events as e
      inner join public.persons as p on p.id = event_members.person_id
      where e.id = event_members.event_id
        and e.family_id = p.family_id
        and public.has_family_role(e.family_id, array['owner', 'admin', 'editor'])
    )
  );

create policy "Editors and above can remove event participants"
  on public.event_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.events as e
      where e.id = event_members.event_id
        and public.has_family_role(e.family_id, array['owner', 'admin', 'editor'])
    )
  );
