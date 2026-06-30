-- Allow invitees to view the profile of the user who invited them.

create policy "Invitees can view inviter profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.family_invitations as invitations
      where invitations.invited_by = profiles.user_id
        and lower(invitations.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and invitations.accepted_at is null
        and invitations.expires_at > now()
    )
  );
