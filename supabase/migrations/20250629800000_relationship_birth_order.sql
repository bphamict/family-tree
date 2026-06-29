-- Birth order among a parent's children (1 = eldest).

alter table public.relationships
  add column birth_order integer,
  add constraint relationships_birth_order_positive check (
    birth_order is null or birth_order > 0
  );

create index relationships_parent_birth_order_idx
  on public.relationships (person1_id, birth_order)
  where relationship_type in ('parent', 'adoptive_parent', 'guardian');

-- Backfill existing parent-child rows using birth date, then name.
with ranked as (
  select
    r.id,
    row_number() over (
      partition by r.person1_id
      order by
        p.birth_date asc nulls last,
        p.last_name asc,
        p.first_name asc,
        r.created_at asc
    ) as rn
  from public.relationships as r
  inner join public.persons as p on p.id = r.person2_id
  where r.relationship_type in ('parent', 'adoptive_parent', 'guardian')
)
update public.relationships as r
set birth_order = ranked.rn
from ranked
where r.id = ranked.id;

create or replace function public.next_child_birth_order(p_parent_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(r.birth_order), 0) + 1
  from public.relationships as r
  where r.person1_id = p_parent_id
    and r.relationship_type in ('parent', 'adoptive_parent', 'guardian');
$$;

revoke all on function public.next_child_birth_order(uuid) from public;
grant execute on function public.next_child_birth_order(uuid) to authenticated;

drop function if exists public.create_relationship(uuid, uuid, text, date, date);

create or replace function public.create_relationship(
  p_person1_id uuid,
  p_person2_id uuid,
  p_relationship_type text,
  p_start_date date default null,
  p_end_date date default null,
  p_birth_order integer default null
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
  v_birth_order integer := p_birth_order;
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
    v_birth_order := null;
  else
    if v_birth_order is not null and v_birth_order <= 0 then
      raise exception 'Birth order must be a positive integer';
    end if;
  end if;

  if v_type in ('parent', 'adoptive_parent') then
    if public.would_create_parent_cycle(v_person1_id, v_person2_id) then
      raise exception 'This relationship would create a cycle in the family tree';
    end if;
  end if;

  if v_type in ('parent', 'adoptive_parent', 'guardian') and v_birth_order is null then
    v_birth_order := public.next_child_birth_order(v_person1_id);
  end if;

  insert into public.relationships (
    person1_id,
    person2_id,
    relationship_type,
    start_date,
    end_date,
    birth_order
  )
  values (
    v_person1_id,
    v_person2_id,
    v_type,
    p_start_date,
    p_end_date,
    v_birth_order
  )
  returning id into v_relationship_id;

  return v_relationship_id;
end;
$$;

revoke all on function public.create_relationship(uuid, uuid, text, date, date, integer) from public;
grant execute on function public.create_relationship(uuid, uuid, text, date, date, integer) to authenticated;
