create table if not exists public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  requested_role text not null,
  intro_message text not null,
  status text not null check (status in ('pending', 'accepted', 'rejected', 'cancelled')) default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  decision_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_join_requests_team_id on public.team_join_requests (team_id);
create index if not exists idx_team_join_requests_applicant_id on public.team_join_requests (applicant_id);
create unique index if not exists idx_team_join_requests_pending_unique
on public.team_join_requests (team_id, applicant_id)
where status = 'pending';

drop trigger if exists set_team_join_requests_updated_at on public.team_join_requests;
create trigger set_team_join_requests_updated_at
before update on public.team_join_requests
for each row execute function public.set_updated_at();

alter table public.team_join_requests enable row level security;

drop policy if exists "team_join_requests_select_applicant_or_owner" on public.team_join_requests;
create policy "team_join_requests_select_applicant_or_owner"
on public.team_join_requests
for select
to authenticated
using (
  applicant_id = (select auth.uid())
  or exists (
    select 1
    from public.teams t
    where t.id = team_join_requests.team_id
      and t.owner_id = (select auth.uid())
  )
);

drop policy if exists "team_join_requests_insert_applicant" on public.team_join_requests;
create policy "team_join_requests_insert_applicant"
on public.team_join_requests
for insert
to authenticated
with check (
  applicant_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1
    from public.teams t
    where t.id = team_join_requests.team_id
      and t.is_recruiting = true
      and t.owner_id <> (select auth.uid())
      and not public.is_team_member(t.id, (select auth.uid()))
  )
);

drop policy if exists "team_join_requests_update_applicant_cancel" on public.team_join_requests;
create policy "team_join_requests_update_applicant_cancel"
on public.team_join_requests
for update
to authenticated
using (
  applicant_id = (select auth.uid())
  and status = 'pending'
)
with check (
  applicant_id = (select auth.uid())
  and status = 'cancelled'
  and reviewed_by is null
);

drop policy if exists "team_join_requests_update_owner_review" on public.team_join_requests;
create policy "team_join_requests_update_owner_review"
on public.team_join_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.teams t
    where t.id = team_join_requests.team_id
      and t.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.teams t
    where t.id = team_join_requests.team_id
      and t.owner_id = (select auth.uid())
  )
  and status in ('accepted', 'rejected')
  and reviewed_by = (select auth.uid())
);
