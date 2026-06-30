-- Fix invited users not seeing families after accepting an invitation.
-- 1. ensure_user_profile no longer depends on auth.users (not readable on Supabase Cloud).
-- 2. Users can read their own membership rows directly.
-- 3. Invitees can read family details for pending invitations.

create or replace function public.ensure_user_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
begin
  if p_user_id is null then
    return;
  end if;

  if p_user_id <> auth.uid() then
    raise exception 'Cannot ensure profile for another user';
  end if;

  v_full_name := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    auth.jwt() ->> 'email',
    'User'
  );

  insert into public.profiles (user_id, full_name)
  values (p_user_id, v_full_name)
  on conflict (user_id) do nothing;
end;
$$;

create policy "Users can view own memberships"
  on public.memberships
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Invitees can view invited families"
  on public.families
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.family_invitations as invitations
      where invitations.family_id = families.id
        and lower(invitations.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and invitations.accepted_at is null
        and invitations.expires_at > now()
    )
  );
