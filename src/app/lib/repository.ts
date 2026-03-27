import type { User } from '@supabase/supabase-js';
import { startTransition } from 'react';
import { getUserDisplayName, normalizeUserRole } from './auth';
import { appEnv } from './env';
import { createSignedSubmissionAssetUrls } from './storage';
import { getSupabaseBrowserClient } from './supabase';
import { SEED_HACKATHONS, SEED_LEADERBOARD, SEED_SUBMISSIONS, SEED_TEAMS } from './mock-data';
import { STORAGE_KEYS } from './constants';
import type {
  AppUser,
  BootstrapData,
  Hackathon,
  LeaderboardEntry,
  Submission,
  SubmissionFormInput,
  SubmissionVersion,
  Team,
  TeamFormInput,
} from '../types/domain';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createId(prefix: string) {
  return appEnv.hasSupabase ? createUuid() : `${prefix}-${createUuid()}`;
}

function readStoredCollection<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return clone(fallback);
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return clone(fallback);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
}

function writeStoredCollection<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mapSupabaseUser(user: User): AppUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: getUserDisplayName(user),
    primaryRole: normalizeUserRole(user.user_metadata?.primary_role),
  };
}

function ensureNoSupabaseError(error: { message: string } | null, context: string) {
  if (!error) {
    return;
  }

  throw new Error(`${context}: ${error.message}`);
}

function normalizeRanks(entries: LeaderboardEntry[]) {
  return [...entries]
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function getFallbackData(): BootstrapData {
  return {
    hackathons: clone(SEED_HACKATHONS),
    teams: readStoredCollection(STORAGE_KEYS.teams, SEED_TEAMS),
    submissions: readStoredCollection(STORAGE_KEYS.submissions, SEED_SUBMISSIONS),
    leaderboardEntries: readStoredCollection(STORAGE_KEYS.leaderboards, SEED_LEADERBOARD),
  };
}

export function loadFallbackBootstrapData() {
  return getFallbackData();
}

function mapHackathonRecord(record: Record<string, any>): Hackathon {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    organizer: record.organizer,
    summary: record.summary,
    description: record.description,
    status: record.status,
    location: record.location,
    tags: record.tags ?? [],
    submissionDeadline: record.submission_deadline,
    eventEndAt: record.event_end_at,
    participants: record.participants ?? 0,
    teamCount: record.team_count ?? 0,
    teamMinSize: record.team_min_size ?? 2,
    teamMaxSize: record.team_max_size ?? 4,
    published: record.published ?? true,
    guideLinks: record.guide_links ?? [],
    guideItems: record.guide_items ?? [],
    evaluationCriteria: record.evaluation_criteria ?? [],
    prizes: record.prizes ?? [],
    schedule: record.schedule ?? [],
    teamPolicy: record.team_policy ?? [],
  };
}

function mapTeamRecord(record: Record<string, any>, members: Record<string, any>[]): Team {
  return {
    id: record.id,
    hackathonId: record.hackathon_id,
    ownerId: record.owner_id,
    name: record.name,
    description: record.description,
    currentSize: record.current_size,
    maxSize: record.max_size,
    isRecruiting: record.is_recruiting,
    desiredRoles: record.desired_roles ?? [],
    techTags: record.tech_tags ?? [],
    contactUrl: record.contact_url,
    updatedAt: record.updated_at,
    members: members
      .filter((member) => member.team_id === record.id)
      .map((member) => ({
        profileId: member.profile_id,
        displayName: member.display_name,
        roleLabel: member.role_label,
        isOwner: member.is_owner,
      })),
  };
}

function mapSubmissionRecord(record: Record<string, any>, versions: Record<string, any>[]): Submission {
  return {
    id: record.id,
    hackathonId: record.hackathon_id,
    teamId: record.team_id,
    proposalSummary: record.proposal_summary,
    proposalUrl: record.proposal_url,
    deployUrl: record.deploy_url,
    githubUrl: record.github_url,
    solutionPdfUrl: record.resolved_solution_pdf_url ?? record.solution_pdf_url ?? '',
    solutionPdfPath: record.solution_pdf_path ?? '',
    demoVideoUrl: record.demo_video_url ?? '',
    status: record.status,
    updatedAt: record.updated_at,
    finalSubmittedAt: record.final_submitted_at,
    versions: versions
      .filter((version) => version.submission_id === record.id)
      .map((version) => ({
        versionNumber: version.version_number,
        proposalSummary: version.proposal_summary,
        proposalUrl: version.proposal_url,
        deployUrl: version.deploy_url,
        githubUrl: version.github_url,
        solutionPdfUrl: version.resolved_solution_pdf_url ?? version.solution_pdf_url ?? '',
        solutionPdfPath: version.solution_pdf_path ?? '',
        demoVideoUrl: version.demo_video_url ?? '',
        savedAt: version.saved_at,
      })),
  };
}

function mapLeaderboardRecord(record: Record<string, any>): LeaderboardEntry {
  return {
    id: record.id,
    hackathonId: record.hackathon_id,
    teamId: record.team_id,
    teamName: record.team_name,
    rank: record.rank,
    totalScore: record.score_total,
    participantScore: record.score_participant,
    judgeScore: record.score_judge,
    submittedAt: record.submitted_at,
    projectUrl: record.project_url,
  };
}

export async function loadBootstrapData(currentUserId?: string | null): Promise<BootstrapData> {
  if (!appEnv.hasSupabase) {
    return getFallbackData();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return getFallbackData();
  }

  const shouldLoadPrivateData = Boolean(currentUserId);
  const [
    { data: hackathons, error: hackathonsError },
    { data: teams, error: teamsError },
    { data: members, error: membersError },
    { data: submissions, error: submissionsError },
    { data: versions, error: versionsError },
    { data: leaderboardEntries, error: leaderboardError },
  ] = await Promise.all([
    supabase.from('hackathons').select('*').eq('published', true).order('submission_deadline', { ascending: true }),
    supabase.from('teams').select('*').order('updated_at', { ascending: false }),
    supabase.from('team_members').select('*'),
    shouldLoadPrivateData
      ? supabase.from('submissions').select('*').order('updated_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    shouldLoadPrivateData
      ? supabase.from('submission_versions').select('*').order('saved_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase.from('leaderboard_entries').select('*').order('score_total', { ascending: false }),
  ]);

  ensureNoSupabaseError(hackathonsError, '해커톤 목록을 불러오지 못했습니다');
  ensureNoSupabaseError(teamsError, '팀 목록을 불러오지 못했습니다');
  ensureNoSupabaseError(membersError, '팀 멤버 정보를 불러오지 못했습니다');
  ensureNoSupabaseError(submissionsError, '제출 정보를 불러오지 못했습니다');
  ensureNoSupabaseError(versionsError, '제출 버전 이력을 불러오지 못했습니다');
  ensureNoSupabaseError(leaderboardError, '리더보드를 불러오지 못했습니다');

  const allSubmissionAssetPaths = [...(submissions ?? []), ...(versions ?? [])]
    .map((record) => record.solution_pdf_path as string | undefined)
    .filter((path): path is string => Boolean(path));

  const signedUrlMap = await createSignedSubmissionAssetUrls(allSubmissionAssetPaths);
  const hydratedSubmissions = (submissions ?? []).map((record) => ({
    ...record,
    resolved_solution_pdf_url: record.solution_pdf_path ? signedUrlMap.get(record.solution_pdf_path) ?? '' : record.solution_pdf_url ?? '',
  }));
  const hydratedVersions = (versions ?? []).map((record) => ({
    ...record,
    resolved_solution_pdf_url: record.solution_pdf_path ? signedUrlMap.get(record.solution_pdf_path) ?? '' : record.solution_pdf_url ?? '',
  }));

  return {
    hackathons: (hackathons ?? []).map((record) => mapHackathonRecord(record)),
    teams: (teams ?? []).map((record) => mapTeamRecord(record, members ?? [])),
    submissions: hydratedSubmissions.map((record) => mapSubmissionRecord(record, hydratedVersions)),
    leaderboardEntries: (leaderboardEntries ?? []).map((record) => mapLeaderboardRecord(record)),
  };
}

export async function upsertProfile(user: AppUser) {
  if (!appEnv.hasSupabase) {
    return user;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return user;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    primary_role: user.primaryRole,
    is_admin: Boolean(user.isAdmin),
  });

  ensureNoSupabaseError(error, '프로필을 저장하지 못했습니다');

  return user;
}

export async function saveTeam(input: TeamFormInput, currentUser: AppUser) {
  const teamPayload: Team = {
    id: input.id ?? createId('team'),
    hackathonId: input.hackathonId,
    ownerId: currentUser.id,
    name: input.name,
    description: input.description,
    currentSize: input.currentSize,
    maxSize: input.maxSize,
    isRecruiting: input.isRecruiting,
    desiredRoles: input.desiredRoles,
    techTags: input.techTags,
    contactUrl: input.contactUrl,
    updatedAt: new Date().toISOString(),
    members: [
      {
        profileId: currentUser.id,
        displayName: currentUser.displayName,
        roleLabel: currentUser.primaryRole ? `${currentUser.displayName} / ${currentUser.primaryRole}` : `${currentUser.displayName} / 팀장`,
        isOwner: true,
      },
    ],
  };

  if (!appEnv.hasSupabase) {
    const nextTeams = readStoredCollection(STORAGE_KEYS.teams, SEED_TEAMS);
    const index = nextTeams.findIndex((team) => team.id === teamPayload.id);

    if (index >= 0) {
      nextTeams[index] = teamPayload;
    } else {
      nextTeams.unshift(teamPayload);
    }

    writeStoredCollection(STORAGE_KEYS.teams, nextTeams);
    return teamPayload;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return teamPayload;
  }

  const { error: teamError } = await supabase.from('teams').upsert({
    id: teamPayload.id,
    hackathon_id: teamPayload.hackathonId,
    owner_id: teamPayload.ownerId,
    name: teamPayload.name,
    description: teamPayload.description,
    current_size: teamPayload.currentSize,
    max_size: teamPayload.maxSize,
    is_recruiting: teamPayload.isRecruiting,
    desired_roles: teamPayload.desiredRoles,
    tech_tags: teamPayload.techTags,
    contact_url: teamPayload.contactUrl,
    updated_at: teamPayload.updatedAt,
  });
  ensureNoSupabaseError(teamError, '팀 정보를 저장하지 못했습니다');

  const { error: memberError } = await supabase.from('team_members').upsert({
    team_id: teamPayload.id,
    profile_id: currentUser.id,
    display_name: currentUser.displayName,
    role_label: currentUser.primaryRole ?? '팀장',
    is_owner: true,
  });
  ensureNoSupabaseError(memberError, '팀장 정보를 저장하지 못했습니다');

  return teamPayload;
}

function buildVersion(input: SubmissionFormInput, currentVersions: SubmissionVersion[]) {
  return {
    versionNumber: currentVersions.length + 1,
    proposalSummary: input.proposalSummary,
    proposalUrl: input.proposalUrl,
    deployUrl: input.deployUrl,
    githubUrl: input.githubUrl,
    solutionPdfUrl: input.solutionPdfUrl,
    solutionPdfPath: input.solutionPdfPath,
    demoVideoUrl: input.demoVideoUrl,
    savedAt: new Date().toISOString(),
  };
}

function updateFallbackSubmissionStorage(nextSubmission: Submission, finalize: boolean) {
  const submissions = readStoredCollection(STORAGE_KEYS.submissions, SEED_SUBMISSIONS);
  const index = submissions.findIndex((item) => item.id === nextSubmission.id);

  if (index >= 0) {
    submissions[index] = nextSubmission;
  } else {
    submissions.unshift(nextSubmission);
  }

  writeStoredCollection(STORAGE_KEYS.submissions, submissions);

  if (finalize) {
    const leaderboardEntries = readStoredCollection(STORAGE_KEYS.leaderboards, SEED_LEADERBOARD);
    const existingIndex = leaderboardEntries.findIndex((item) => item.teamId === nextSubmission.teamId);
    const scoreSeed = 80 + Math.min(nextSubmission.versions.length, 10) * 1.3;
    const entry: LeaderboardEntry = {
      id: existingIndex >= 0 ? leaderboardEntries[existingIndex].id : createId('leaderboard'),
      hackathonId: nextSubmission.hackathonId,
      teamId: nextSubmission.teamId,
      teamName:
        readStoredCollection(STORAGE_KEYS.teams, SEED_TEAMS).find((team) => team.id === nextSubmission.teamId)?.name ?? '신규 팀',
      rank: 0,
      totalScore: Number(scoreSeed.toFixed(1)),
      participantScore: Number((scoreSeed / 2).toFixed(1)),
      judgeScore: Number((scoreSeed / 2).toFixed(1)),
      submittedAt: nextSubmission.finalSubmittedAt ?? nextSubmission.updatedAt,
      projectUrl: nextSubmission.deployUrl,
    };

    if (existingIndex >= 0) {
      leaderboardEntries[existingIndex] = entry;
    } else {
      leaderboardEntries.push(entry);
    }

    writeStoredCollection(STORAGE_KEYS.leaderboards, normalizeRanks(leaderboardEntries));
  }
}

export async function saveSubmission(
  input: SubmissionFormInput,
  currentSubmission: Submission | null,
  finalize: boolean
) {
  const persistedSolutionPdfUrl = input.solutionPdfPath ? '' : input.solutionPdfUrl;
  const nextVersion = buildVersion(input, currentSubmission?.versions ?? []);
  const nextSubmission: Submission = {
    id: currentSubmission?.id ?? createId('submission'),
    hackathonId: input.hackathonId,
    teamId: input.teamId,
    proposalSummary: input.proposalSummary,
    proposalUrl: input.proposalUrl,
    deployUrl: input.deployUrl,
    githubUrl: input.githubUrl,
    solutionPdfUrl: input.solutionPdfUrl,
    solutionPdfPath: input.solutionPdfPath,
    demoVideoUrl: input.demoVideoUrl,
    status: finalize ? 'submitted' : 'draft',
    updatedAt: nextVersion.savedAt,
    finalSubmittedAt: finalize ? nextVersion.savedAt : currentSubmission?.finalSubmittedAt ?? null,
    versions: [...(currentSubmission?.versions ?? []), nextVersion],
  };

  if (!appEnv.hasSupabase) {
    updateFallbackSubmissionStorage(nextSubmission, finalize);
    return nextSubmission;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    updateFallbackSubmissionStorage(nextSubmission, finalize);
    return nextSubmission;
  }

  const { error: submissionError } = await supabase.from('submissions').upsert({
    id: nextSubmission.id,
    hackathon_id: nextSubmission.hackathonId,
    team_id: nextSubmission.teamId,
    proposal_summary: nextSubmission.proposalSummary,
    proposal_url: nextSubmission.proposalUrl,
    deploy_url: nextSubmission.deployUrl,
    github_url: nextSubmission.githubUrl,
    solution_pdf_url: persistedSolutionPdfUrl,
    solution_pdf_path: nextSubmission.solutionPdfPath,
    demo_video_url: nextSubmission.demoVideoUrl,
    status: nextSubmission.status,
    updated_at: nextSubmission.updatedAt,
    final_submitted_at: nextSubmission.finalSubmittedAt,
  });
  ensureNoSupabaseError(submissionError, '제출 정보를 저장하지 못했습니다');

  const { error: versionError } = await supabase.from('submission_versions').insert({
    submission_id: nextSubmission.id,
    version_number: nextVersion.versionNumber,
    proposal_summary: nextVersion.proposalSummary,
    proposal_url: nextVersion.proposalUrl,
    deploy_url: nextVersion.deployUrl,
    github_url: nextVersion.githubUrl,
    solution_pdf_url: persistedSolutionPdfUrl,
    solution_pdf_path: nextVersion.solutionPdfPath,
    demo_video_url: nextVersion.demoVideoUrl,
    saved_at: nextVersion.savedAt,
  });
  ensureNoSupabaseError(versionError, '제출 버전 이력을 저장하지 못했습니다');

  return nextSubmission;
}

export function syncDemoUser(user: AppUser | null) {
  startTransition(() => {
    if (!user) return;
    writeStoredCollection(STORAGE_KEYS.profile, {
      state: {
        demoUser: user,
      },
    });
  });
}

export { mapSupabaseUser };
