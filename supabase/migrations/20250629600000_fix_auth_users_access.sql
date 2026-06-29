-- Supabase Cloud does not grant SELECT on auth.users to the authenticated role.
-- Foreign-key checks and RLS subqueries against auth.users therefore fail with 42501.
-- Use public.profiles(user_id) for FKs and auth.jwt() for the current user's email.

-- Repoint foreign keys from auth.users to public.profiles(user_id)
alter table public.memberships
  drop constraint if exists memberships_user_id_fkey;

alter table public.memberships
  add constraint memberships_user_id_fkey
  foreign key (user_id) references public.profiles (user_id) on delete cascade;

alter table public.family_invitations
  drop constraint if exists family_invitations_invited_by_fkey;

alter table public.family_invitations
  add constraint family_invitations_invited_by_fkey
  foreign key (invited_by) references public.profiles (user_id) on delete cascade;

alter table public.documents
  drop constraint if exists documents_uploaded_by_fkey;

alter table public.documents
  add constraint documents_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles (user_id) on delete restrict;

-- RLS: read email from JWT instead of auth.users
drop policy if exists "Users can view relevant invitations" on public.family_invitations;

create policy "Users can view relevant invitations"
  on public.family_invitations
  for select
  to authenticated
  using (
    public.has_family_role(family_id, array['owner', 'admin'])
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Invitees can decline their own invitations" on public.family_invitations;

create policy "Invitees can decline their own invitations"
  on public.family_invitations
  for delete
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- RPC: read email from JWT instead of auth.users
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
