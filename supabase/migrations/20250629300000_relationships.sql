-- Genealogy relationships between persons.
-- See docs/DATABASE_DESIGN.md

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  person1_id uuid not null references public.persons (id) on delete cascade,
  person2_id uuid not null references public.persons (id) on delete cascade,
  relationship_type text not null check (
    relationship_type in ('parent', 'child', 'spouse', 'adoptive_parent', 'guardian')
  ),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_different_persons check (person1_id <> person2_id),
  constraint relationships_dates_valid check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index relationships_person1_id_idx on public.relationships (person1_id);
create index relationships_person2_id_idx on public.relationships (person2_id);
create index relationships_type_idx on public.relationships (relationship_type);

create unique index relationships_directed_unique_idx
  on public.relationships (person1_id, person2_id, relationship_type)
  where relationship_type in ('parent', 'adoptive_parent', 'guardian');

create unique index relationships_spouse_unique_idx
  on public.relationships (
    least(person1_id, person2_id),
    greatest(person1_id, person2_id)
  )
  where relationship_type = 'spouse';

create trigger relationships_updated_at
  before update on public.relationships
  for each row
  execute function public.handle_updated_at();

create or replace function public.persons_in_same_family(
  p_person1_id uuid,
  p_person2_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.persons as p1
    inner join public.persons as p2 on p1.family_id = p2.family_id
    where p1.id = p_person1_id
      and p2.id = p_person2_id
  );
$$;

create or replace function public.would_create_parent_cycle(
  p_parent_id uuid,
  p_child_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with recursive ancestors as (
    select r.person1_id as ancestor_id
    from public.relationships as r
    where r.person2_id = p_parent_id
      and r.relationship_type in ('parent', 'adoptive_parent')

    union

    select r.person1_id
    from public.relationships as r
    inner join ancestors as a on r.person2_id = a.ancestor_id
    where r.relationship_type in ('parent', 'adoptive_parent')
  )
  select exists (
    select 1
    from ancestors
    where ancestor_id = p_child_id
  );
$$;

create or replace function public.can_manage_person_relationships(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.persons as p
    inner join public.memberships as m on m.family_id = p.family_id
    where p.id = p_person_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'editor')
  );
$$;

create or replace function public.can_view_person_relationships(p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.persons as p
    inner join public.memberships as m on m.family_id = p.family_id
    where p.id = p_person_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.create_relationship(
  p_person1_id uuid,
  p_person2_id uuid,
  p_relationship_type text,
  p_start_date date default null,
  p_end_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person1_id uuid := p_person1_id;
  v_person2_id uuid := p_person2_id;
  v_type text := p_relationship_type;
  v_relationship_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_person1_id = v_person2_id then
    raise exception 'A person cannot have a relationship with themselves';
  end if;

  if not public.persons_in_same_family(v_person1_id, v_person2_id) then
    raise exception 'Persons must belong to the same family';
  end if;

  if not public.can_manage_person_relationships(v_person1_id) then
    raise exception 'You do not have permission to manage relationships';
  end if;

  if v_type = 'child' then
    v_type := 'parent';
    v_person1_id := p_person2_id;
    v_person2_id := p_person1_id;
  end if;

  if v_type = 'spouse' then
    if v_person1_id > v_person2_id then
      v_person1_id := p_person2_id;
      v_person2_id := p_person1_id;
    end if;
  end if;

  if v_type in ('parent', 'adoptive_parent') then
    if public.would_create_parent_cycle(v_person1_id, v_person2_id) then
      raise exception 'This relationship would create a cycle in the family tree';
    end if;
  end if;

  insert into public.relationships (
    person1_id,
    person2_id,
    relationship_type,
    start_date,
    end_date
  )
  values (
    v_person1_id,
    v_person2_id,
    v_type,
    p_start_date,
    p_end_date
  )
  returning id into v_relationship_id;

  return v_relationship_id;
end;
$$;

revoke all on function public.create_relationship(uuid, uuid, text, date, date) from public;
grant execute on function public.create_relationship(uuid, uuid, text, date, date) to authenticated;

alter table public.relationships enable row level security;

create policy "Family members can view relationships"
  on public.relationships
  for select
  to authenticated
  using (
    public.can_view_person_relationships(person1_id)
    and public.can_view_person_relationships(person2_id)
  );

create policy "Editors and above can create relationships"
  on public.relationships
  for insert
  to authenticated
  with check (
    public.can_manage_person_relationships(person1_id)
    and public.can_manage_person_relationships(person2_id)
    and public.persons_in_same_family(person1_id, person2_id)
  );

create policy "Editors and above can update relationships"
  on public.relationships
  for update
  to authenticated
  using (
    public.can_manage_person_relationships(person1_id)
    and public.can_manage_person_relationships(person2_id)
  )
  with check (
    public.can_manage_person_relationships(person1_id)
    and public.can_manage_person_relationships(person2_id)
    and public.persons_in_same_family(person1_id, person2_id)
  );

create policy "Editors and above can delete relationships"
  on public.relationships
  for delete
  to authenticated
  using (
    public.can_manage_person_relationships(person1_id)
    and public.can_manage_person_relationships(person2_id)
  );
