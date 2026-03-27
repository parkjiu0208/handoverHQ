import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import {
  SEED_HACKATHONS,
  SEED_LEADERBOARD,
  SEED_SUBMISSIONS,
  SEED_TEAMS,
  SEED_USERS,
} from '../src/app/lib/mock-data.ts';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((accumulator, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return accumulator;
      }

      const delimiterIndex = trimmed.indexOf('=');
      if (delimiterIndex < 0) {
        return accumulator;
      }

      const key = trimmed.slice(0, delimiterIndex).trim();
      const rawValue = trimmed.slice(delimiterIndex + 1).trim();
      const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');
      accumulator[key] = normalizedValue;
      return accumulator;
    }, {});
}

function resolveEnv() {
  const cwd = process.cwd();
  return {
    ...parseEnvFile(path.join(cwd, '.env')),
    ...parseEnvFile(path.join(cwd, '.env.local')),
    ...process.env,
  };
}

function stableUuid(seed) {
  const hex = crypto.createHash('sha1').update(`handoverhq:${seed}`).digest('hex');
  const third = `5${hex.slice(13, 16)}`;
  const variant = (parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80;

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    third,
    `${variant.toString(16).padStart(2, '0')}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function seedEmailFromLegacyId(legacyId) {
  return `${legacyId.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}@seed.handoverhq.dev`;
}

function collectUserSeeds() {
  const userSeedMap = new Map();

  for (const user of SEED_USERS) {
    userSeedMap.set(user.id, {
      legacyId: user.id,
      email: user.email,
      displayName: user.displayName,
      primaryRole: user.primaryRole,
      isAdmin: Boolean(user.isAdmin),
    });
  }

  for (const team of SEED_TEAMS) {
    if (!userSeedMap.has(team.ownerId)) {
      userSeedMap.set(team.ownerId, {
        legacyId: team.ownerId,
        email: seedEmailFromLegacyId(team.ownerId),
        displayName: team.members.find((member) => member.profileId === team.ownerId)?.displayName ?? team.name,
        primaryRole: null,
        isAdmin: false,
      });
    }

    for (const member of team.members) {
      if (userSeedMap.has(member.profileId)) {
        continue;
      }

      userSeedMap.set(member.profileId, {
        legacyId: member.profileId,
        email: seedEmailFromLegacyId(member.profileId),
        displayName: member.displayName,
        primaryRole: null,
        isAdmin: false,
      });
    }
  }

  return [...userSeedMap.values()];
}

async function ensureSeedUser(supabase, seed) {
  const { data: existingProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', seed.email)
    .limit(1);

  if (profileError) {
    throw profileError;
  }

  const existingProfile = existingProfiles?.[0];
  let userId = existingProfile?.id;

  if (!userId) {
    const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
      email: seed.email,
      password: `SeedUser!${crypto.randomBytes(8).toString('hex')}`,
      email_confirm: true,
      user_metadata: {
        display_name: seed.displayName,
        full_name: seed.displayName,
        primary_role: seed.primaryRole,
      },
    });

    if (createUserError || !createdUserData.user) {
      throw createUserError ?? new Error(`시드 사용자 생성 실패: ${seed.email}`);
    }

    userId = createdUserData.user.id;
  }

  const { error: upsertProfileError } = await supabase.from('profiles').upsert({
    id: userId,
    email: seed.email,
    display_name: seed.displayName,
    primary_role: seed.primaryRole,
    is_admin: seed.isAdmin,
  });

  if (upsertProfileError) {
    throw upsertProfileError;
  }

  return userId;
}

async function main() {
  const env = resolveEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VITE_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 먼저 설정해주세요.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const userIdMap = new Map();
  for (const userSeed of collectUserSeeds()) {
    const userId = await ensureSeedUser(supabase, userSeed);
    userIdMap.set(userSeed.legacyId, userId);
  }

  const hackathonRows = SEED_HACKATHONS.map((hackathon) => ({
    id: stableUuid(`hackathon:${hackathon.slug}`),
    slug: hackathon.slug,
    title: hackathon.title,
    organizer: hackathon.organizer,
    summary: hackathon.summary,
    description: hackathon.description,
    status: hackathon.status,
    location: hackathon.location,
    tags: hackathon.tags,
    submission_deadline: hackathon.submissionDeadline,
    event_end_at: hackathon.eventEndAt,
    participants: hackathon.participants,
    team_count: hackathon.teamCount,
    team_min_size: hackathon.teamMinSize,
    team_max_size: hackathon.teamMaxSize,
    published: hackathon.published,
    guide_links: hackathon.guideLinks,
    guide_items: hackathon.guideItems,
    evaluation_criteria: hackathon.evaluationCriteria,
    prizes: hackathon.prizes,
    schedule: hackathon.schedule,
    team_policy: hackathon.teamPolicy,
  }));

  const { error: hackathonError } = await supabase.from('hackathons').upsert(hackathonRows, {
    onConflict: 'id',
  });

  if (hackathonError) {
    throw hackathonError;
  }

  const hackathonIdMap = new Map(
    SEED_HACKATHONS.map((hackathon) => [hackathon.id, stableUuid(`hackathon:${hackathon.slug}`)])
  );
  const teamIdMap = new Map(SEED_TEAMS.map((team) => [team.id, stableUuid(`team:${team.id}`)]));

  const teamRows = SEED_TEAMS.map((team) => ({
    id: teamIdMap.get(team.id),
    hackathon_id: hackathonIdMap.get(team.hackathonId),
    owner_id: userIdMap.get(team.ownerId),
    name: team.name,
    description: team.description,
    current_size: team.currentSize,
    max_size: team.maxSize,
    is_recruiting: team.isRecruiting,
    desired_roles: team.desiredRoles,
    tech_tags: team.techTags,
    contact_url: team.contactUrl,
    updated_at: team.updatedAt,
  }));

  const { error: teamError } = await supabase.from('teams').upsert(teamRows, {
    onConflict: 'id',
  });

  if (teamError) {
    throw teamError;
  }

  const memberRows = SEED_TEAMS.flatMap((team) =>
    team.members.map((member) => ({
      team_id: teamIdMap.get(team.id),
      profile_id: userIdMap.get(member.profileId),
      display_name: member.displayName,
      role_label: member.roleLabel,
      is_owner: member.isOwner,
    }))
  );

  const { error: memberError } = await supabase.from('team_members').upsert(memberRows, {
    onConflict: 'team_id,profile_id',
  });

  if (memberError) {
    throw memberError;
  }

  const submissionRows = SEED_SUBMISSIONS.map((submission) => ({
    id: stableUuid(`submission:${submission.id}`),
    hackathon_id: hackathonIdMap.get(submission.hackathonId),
    team_id: teamIdMap.get(submission.teamId),
    proposal_summary: submission.proposalSummary,
    proposal_url: submission.proposalUrl,
    deploy_url: submission.deployUrl,
    github_url: submission.githubUrl,
    solution_pdf_url: submission.solutionPdfPath ? '' : submission.solutionPdfUrl,
    solution_pdf_path: submission.solutionPdfPath,
    demo_video_url: submission.demoVideoUrl,
    status: submission.status,
    updated_at: submission.updatedAt,
    final_submitted_at: submission.finalSubmittedAt,
  }));

  const { error: submissionError } = await supabase.from('submissions').upsert(submissionRows, {
    onConflict: 'id',
  });

  if (submissionError) {
    throw submissionError;
  }

  const versionRows = SEED_SUBMISSIONS.flatMap((submission) =>
    submission.versions.map((version) => ({
      submission_id: stableUuid(`submission:${submission.id}`),
      version_number: version.versionNumber,
      proposal_summary: version.proposalSummary,
      proposal_url: version.proposalUrl,
      deploy_url: version.deployUrl,
      github_url: version.githubUrl,
      solution_pdf_url: version.solutionPdfPath ? '' : version.solutionPdfUrl,
      solution_pdf_path: version.solutionPdfPath,
      demo_video_url: version.demoVideoUrl,
      saved_at: version.savedAt,
    }))
  );

  const { error: versionError } = await supabase.from('submission_versions').upsert(versionRows, {
    onConflict: 'submission_id,version_number',
  });

  if (versionError) {
    throw versionError;
  }

  const leaderboardRows = SEED_LEADERBOARD.map((entry) => ({
    hackathon_id: hackathonIdMap.get(entry.hackathonId),
    team_id: teamIdMap.get(entry.teamId),
    team_name: entry.teamName,
    rank: entry.rank,
    score_total: entry.totalScore,
    score_participant: entry.participantScore,
    score_judge: entry.judgeScore,
    submitted_at: entry.submittedAt,
    project_url: entry.projectUrl,
  }));

  const { error: leaderboardError } = await supabase.from('leaderboard_entries').upsert(leaderboardRows, {
    onConflict: 'hackathon_id,team_id',
  });

  if (leaderboardError) {
    throw leaderboardError;
  }

  console.log(
    [
      `users=${userIdMap.size}`,
      `hackathons=${hackathonRows.length}`,
      `teams=${teamRows.length}`,
      `team_members=${memberRows.length}`,
      `submissions=${submissionRows.length}`,
      `submission_versions=${versionRows.length}`,
      `leaderboard_entries=${leaderboardRows.length}`,
    ].join(' ')
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
