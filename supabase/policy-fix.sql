create or replace function public.is_team_member(target_team_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.profile_id = target_user_id
  );
$$;

drop policy if exists "teams_select_public_or_member" on public.teams;

create policy "teams_select_public_or_member"
on public.teams
for select
to anon, authenticated
using (
  is_recruiting = true
  or owner_id = (select auth.uid())
  or public.is_team_member(id, (select auth.uid()))
);

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
