drop policy if exists "team_members_select_public_or_member" on public.team_members;

create policy "team_members_select_public_or_member"
on public.team_members
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id
      and (
        t.is_recruiting = true
        or t.owner_id = (select auth.uid())
        or team_members.profile_id = (select auth.uid())
      )
  )
);
