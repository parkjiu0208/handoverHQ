create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text not null,
  primary_role text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hackathons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  organizer text not null,
  summary text not null,
  description text not null,
  status text not null check (status in ('upcoming', 'active', 'ended')),
  location text not null,
  tags text[] not null default '{}',
  submission_deadline timestamptz not null,
  event_end_at timestamptz not null,
  participants integer not null default 0,
  team_count integer not null default 0,
  team_min_size integer not null default 2,
  team_max_size integer not null default 4,
  published boolean not null default true,
  guide_links jsonb not null default '[]'::jsonb,
  guide_items jsonb not null default '[]'::jsonb,
  evaluation_criteria jsonb not null default '[]'::jsonb,
  prizes jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  team_policy jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null,
  current_size integer not null default 1,
  max_size integer not null default 4,
  is_recruiting boolean not null default true,
  desired_roles text[] not null default '{}',
  tech_tags text[] not null default '{}',
  contact_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  role_label text not null,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  proposal_summary text not null,
  proposal_url text not null,
  deploy_url text not null,
  github_url text not null,
  solution_pdf_url text not null,
  demo_video_url text not null default '',
  status text not null check (status in ('draft', 'submitted')),
  updated_at timestamptz not null default now(),
  final_submitted_at timestamptz,
  unique (hackathon_id, team_id)
);

create table if not exists public.submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  version_number integer not null,
  proposal_summary text not null,
  proposal_url text not null,
  deploy_url text not null,
  github_url text not null,
  solution_pdf_url text not null,
  demo_video_url text not null default '',
  saved_at timestamptz not null default now(),
  unique (submission_id, version_number)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  team_name text not null,
  rank integer not null default 0,
  score_total numeric(6, 2) not null default 0,
  score_participant numeric(6, 2) not null default 0,
  score_judge numeric(6, 2) not null default 0,
  submitted_at timestamptz not null default now(),
  project_url text not null default '',
  updated_at timestamptz not null default now(),
  unique (hackathon_id, team_id)
);

create index if not exists idx_hackathons_slug on public.hackathons (slug);
create index if not exists idx_teams_hackathon_id on public.teams (hackathon_id);
create index if not exists idx_teams_owner_id on public.teams (owner_id);
create index if not exists idx_team_members_team_id on public.team_members (team_id);
create index if not exists idx_team_members_profile_id on public.team_members (profile_id);
create index if not exists idx_submissions_hackathon_id on public.submissions (hackathon_id);
create index if not exists idx_submissions_team_id on public.submissions (team_id);
create index if not exists idx_submission_versions_submission_id on public.submission_versions (submission_id);
create index if not exists idx_leaderboard_entries_hackathon_id on public.leaderboard_entries (hackathon_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_hackathons_updated_at on public.hackathons;
create trigger set_hackathons_updated_at
before update on public.hackathons
for each row execute function public.set_updated_at();

drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists set_leaderboard_entries_updated_at on public.leaderboard_entries;
create trigger set_leaderboard_entries_updated_at
before update on public.leaderboard_entries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), '참가자')
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.hackathons enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.leaderboard_entries enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "hackathons_public_select" on public.hackathons;
create policy "hackathons_public_select"
on public.hackathons
for select
to anon, authenticated
using (published = true);

drop policy if exists "teams_select_public_or_member" on public.teams;
create policy "teams_select_public_or_member"
on public.teams
for select
to anon, authenticated
using (
  is_recruiting = true
  or owner_id = (select auth.uid())
  or exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id
      and tm.profile_id = (select auth.uid())
  )
);

drop policy if exists "teams_manage_owner" on public.teams;
create policy "teams_manage_owner"
on public.teams
for all
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "team_members_select_owner_or_member" on public.team_members;
create policy "team_members_select_owner_or_member"
on public.team_members
for select
to authenticated
using (
  exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id
      and (
        t.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.team_members inner_tm
          where inner_tm.team_id = team_members.team_id
            and inner_tm.profile_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "team_members_manage_owner" on public.team_members;
create policy "team_members_manage_owner"
on public.team_members
for all
to authenticated
using (
  exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id
      and t.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id
      and t.owner_id = (select auth.uid())
  )
);

drop policy if exists "submissions_select_team_member" on public.submissions;
create policy "submissions_select_team_member"
on public.submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = submissions.team_id
      and tm.profile_id = (select auth.uid())
  )
);

drop policy if exists "submissions_manage_team_owner" on public.submissions;
create policy "submissions_manage_team_owner"
on public.submissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = submissions.team_id
      and tm.profile_id = (select auth.uid())
      and tm.is_owner = true
  )
);

drop policy if exists "submissions_update_team_owner" on public.submissions;
create policy "submissions_update_team_owner"
on public.submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = submissions.team_id
      and tm.profile_id = (select auth.uid())
      and tm.is_owner = true
  )
)
with check (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = submissions.team_id
      and tm.profile_id = (select auth.uid())
      and tm.is_owner = true
  )
);

drop policy if exists "submission_versions_select_team_member" on public.submission_versions;
create policy "submission_versions_select_team_member"
on public.submission_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.team_members tm on tm.team_id = s.team_id
    where s.id = submission_versions.submission_id
      and tm.profile_id = (select auth.uid())
  )
);

drop policy if exists "submission_versions_insert_team_owner" on public.submission_versions;
create policy "submission_versions_insert_team_owner"
on public.submission_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.submissions s
    join public.team_members tm on tm.team_id = s.team_id
    where s.id = submission_versions.submission_id
      and tm.profile_id = (select auth.uid())
      and tm.is_owner = true
  )
);

drop policy if exists "leaderboard_public_select" on public.leaderboard_entries;
create policy "leaderboard_public_select"
on public.leaderboard_entries
for select
to anon, authenticated
using (true);
