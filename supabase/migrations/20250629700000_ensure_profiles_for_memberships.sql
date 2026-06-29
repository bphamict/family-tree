-- memberships.user_id references public.profiles(user_id) after the auth.users fix.
-- Inserts fail when a user exists in auth.users but has no profiles row yet
-- (e.g. signed up before migrations, or created via the Auth dashboard).

create or replace function public.ensure_user_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.profiles (user_id, full_name)
  select
    users.id,
    coalesce(users.raw_user_meta_data ->> 'full_name', users.email)
  from auth.users as users
  where users.id = p_user_id
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_user_profile(uuid) from public;
grant execute on function public.ensure_user_profile(uuid) to authenticated;

-- Backfill profiles for existing auth users
insert into public.profiles (user_id, full_name)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.email)
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.user_id = users.id
);

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

  perform public.ensure_user_profile(auth.uid());

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

  perform public.ensure_user_profile(auth.uid());

  v_user_email := auth.jwt() ->> 'email';

  if v_user_email is null then
    raise exception 'User email not available';
  end if;

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
