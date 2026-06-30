-- Check whether an email already belongs to a family member.
-- Uses security definer to read auth.users; callable only by owners/admins.

create or replace function public.is_family_member_by_email(
  p_email text,
  p_family_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.has_family_role(p_family_id, array['owner', 'admin']) then
    raise exception 'Not authorized';
  end if;

  return exists (
    select 1
    from public.memberships as memberships
    inner join auth.users as users on users.id = memberships.user_id
    where memberships.family_id = p_family_id
      and lower(users.email) = lower(p_email)
  );
end;
$$;

revoke all on function public.is_family_member_by_email(text, uuid) from public;
grant execute on function public.is_family_member_by_email(text, uuid) to authenticated;
