-- Families and memberships for multi-tenant isolation.
-- See docs/DATABASE_DESIGN.md

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, email)
);

create index families_name_idx on public.families (name);
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_family_id_idx on public.memberships (family_id);
create index family_invitations_family_id_idx on public.family_invitations (family_id);
create index family_invitations_email_idx on public.family_invitations (lower(email));

create trigger families_updated_at
  before update on public.families
  for each row
  execute function public.handle_updated_at();

create trigger memberships_updated_at
  before update on public.memberships
  for each row
  execute function public.handle_updated_at();

-- Helper functions for RLS
create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    where family_id = p_family_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_family_role(
  p_family_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = any (p_roles)
  );
$$;

create or replace function public.create_family_with_owner(
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.families (name, description)
  values (p_name, p_description)
  returning id into v_family_id;

  insert into public.memberships (family_id, user_id, role)
  values (v_family_id, auth.uid(), 'owner');

  return v_family_id;
end;
$$;

create or replace function public.accept_family_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.family_invitations%rowtype;
  v_user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_user_email
  from auth.users
  where id = auth.uid();

  select *
  into v_invitation
  from public.family_invitations
  where token = p_token
    and accepted_at is null
    and expires_at > now();

  if v_invitation.id is null then
    raise exception 'Invitation not found or expired';
  end if;

  if lower(v_invitation.email) <> lower(v_user_email) then
    raise exception 'Invitation email does not match current user';
  end if;

  insert into public.memberships (family_id, user_id, role)
  values (v_invitation.family_id, auth.uid(), v_invitation.role)
  on conflict (family_id, user_id) do update
    set role = excluded.role,
        updated_at = now();

  update public.family_invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return v_invitation.family_id;
end;
$$;

revoke all on function public.create_family_with_owner(text, text) from public;
grant execute on function public.create_family_with_owner(text, text) to authenticated;

revoke all on function public.accept_family_invitation(uuid) from public;
grant execute on function public.accept_family_invitation(uuid) to authenticated;

-- RLS
alter table public.families enable row level security;
alter table public.memberships enable row level security;
alter table public.family_invitations enable row level security;

create policy "Members can view their families"
  on public.families
  for select
  to authenticated
  using (public.is_family_member(id));

create policy "Authenticated users can create families"
  on public.families
  for insert
  to authenticated
  with check (true);

create policy "Owners and admins can update families"
  on public.families
  for update
  to authenticated
  using (public.has_family_role(id, array['owner', 'admin']))
  with check (public.has_family_role(id, array['owner', 'admin']));

create policy "Members can view memberships in their families"
  on public.memberships
  for select
  to authenticated
  using (public.is_family_member(family_id));

create policy "Owners and admins can add memberships"
  on public.memberships
  for insert
  to authenticated
  with check (public.has_family_role(family_id, array['owner', 'admin']));

create policy "Owners and admins can update memberships"
  on public.memberships
  for update
  to authenticated
  using (public.has_family_role(family_id, array['owner', 'admin']))
  with check (public.has_family_role(family_id, array['owner', 'admin']));

create policy "Owners and admins can remove memberships"
  on public.memberships
  for delete
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin'])
    and user_id <> auth.uid()
    and role <> 'owner'
  );

create policy "Users can view relevant invitations"
  on public.family_invitations
  for select
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin'])
    or lower(email) = lower((
      select users.email::text
      from auth.users as users
      where users.id = auth.uid()
    ))
  );

create policy "Owners and admins can create invitations"
  on public.family_invitations
  for insert
  to authenticated
  with check (
    public.has_family_role(family_id, array['owner', 'admin'])
    and invited_by = auth.uid()
  );

create policy "Owners and admins can delete invitations"
  on public.family_invitations
  for delete
  to authenticated
  using (public.has_family_role(family_id, array['owner', 'admin']));

create policy "Invitees can decline their own invitations"
  on public.family_invitations
  for delete
  to authenticated
  using (
    lower(email) = lower((
      select users.email::text
      from auth.users as users
      where users.id = auth.uid()
    ))
  );

-- Allow family members to view profiles of co-members
create policy "Family members can view co-member profiles"
  on public.profiles
  for select
  to authenticated
  using (
    user_id in (
      select m2.user_id
      from public.memberships as m1
      inner join public.memberships as m2 on m1.family_id = m2.family_id
      where m1.user_id = auth.uid()
    )
  );
