import { ROLE_LABEL_MAP } from './constants';
import type {
  AppUser,
  Hackathon,
  HackathonStatus,
  Submission,
  SubmissionStatus,
  TeamMember,
  Team,
  UserRole,
} from '../types/domain';

export function getHackathonStatusLabel(status: HackathonStatus) {
  if (status === 'active') return '모집중';
  if (status === 'upcoming') return '예정';
  return '종료';
}

export function getSubmissionStatusLabel(status: SubmissionStatus) {
  return status === 'submitted' ? '제출 완료' : '초안 저장';
}

export function getRoleLabel(role: UserRole | null) {
  if (!role) return '설정 안 됨';
  return ROLE_LABEL_MAP[role];
}

export function getMyTeams(teams: Team[], user: AppUser | null) {
  if (!user) return [];
  return teams.filter(
    (team) =>
      team.ownerId === user.id ||
      team.members.some((member) => member.profileId === user.id)
  );
}

export function getMyTeamForHackathon(teams: Team[], user: AppUser | null, hackathonId: string) {
  return getMyTeams(teams, user).find((team) => team.hackathonId === hackathonId) ?? null;
}

export function getSubmissionForTeam(submissions: Submission[], teamId: string | null) {
  if (!teamId) return null;
  return submissions.find((submission) => submission.teamId === teamId) ?? null;
}

export function getTeamFitLevel(preferredRole: UserRole | null, team: Team) {
  if (!preferredRole) return { label: '프로필 설정 필요', tone: 'neutral' as const };
  if (team.desiredRoles.includes(preferredRole)) {
    return { label: '높음', tone: 'high' as const };
  }
  if (team.desiredRoles.length === 0) {
    return { label: '판단 불가', tone: 'neutral' as const };
  }
  return { label: '보통', tone: 'medium' as const };
}

export function getTeamLeader(team: Team): TeamMember | null {
  return team.members.find((member) => member.isOwner) ?? team.members[0] ?? null;
}

export function getTeamWorkspaceSummary(team: Team, hackathon: Hackathon | null) {
  if (team.isRecruiting) {
    return `${hackathon?.title ?? '현재 해커톤'} 기준으로 필요한 역할을 빠르게 맞추고, 역할 분담과 제출 준비를 한 곳에서 정리하는 팀입니다.`;
  }

  return '모집은 마감했고, 현재는 팀 내부에서 역할 분담과 제출 품질 점검에 집중하는 운영 모드입니다.';
}

export function getTeamProgressSnapshot(team: Team, submission: Submission | null, hasSubmittedEvidence = false) {
  if (submission?.status === 'submitted' || hasSubmittedEvidence) {
    return {
      label: '최종 제출 완료',
      tone: 'submitted' as const,
      description: submission?.status === 'submitted'
        ? '제출은 마무리됐고, 결과 확인과 후속 정리에 들어간 상태입니다.'
        : '공개 리더보드 기준 제출이 반영된 상태입니다.',
    };
  }

  if (submission) {
    return {
      label: '제출 준비 중',
      tone: 'active' as const,
      description: `초안 ${submission.versions.length}회 저장 기준으로 산출물 품질을 끌어올리는 단계입니다.`,
    };
  }

  if (team.isRecruiting) {
    return {
      label: '팀 셋업 중',
      tone: 'recruiting' as const,
      description: '필요 역할을 보강하면서 MVP 범위와 작업 우선순위를 맞추는 단계입니다.',
    };
  }

  return {
    label: '구현 집중',
    tone: 'default' as const,
    description: '모집을 닫고 구현과 QA에 집중하는 단계입니다.',
  };
}

export function getTeamActivityFeed(team: Team, submission: Submission | null, hackathon: Hackathon | null) {
  const feed = [
    {
      id: `${team.id}-workspace`,
      title: '팀 운영 기준 정리',
      description:
        team.desiredRoles.length > 0
          ? `${team.desiredRoles.map((role) => ROLE_LABEL_MAP[role]).join(', ')} 기준으로 역할 분담을 조율 중입니다.`
          : '현재 인원 기준으로 역할을 재정리하며 안정적으로 운영 중입니다.',
      timestamp: team.updatedAt,
    },
  ];

  if (submission) {
    feed.unshift({
      id: `${team.id}-submission`,
      title: submission.status === 'submitted' ? '최종 제출 반영' : '제출 초안 업데이트',
      description:
        submission.status === 'submitted'
          ? '최종 제출이 완료되어 결과 확인 단계로 전환했습니다.'
          : `현재 제출 초안 버전은 ${submission.versions.length}회 저장되었습니다.`,
      timestamp: submission.finalSubmittedAt ?? submission.updatedAt,
    });
  }

  if (hackathon) {
    feed.push({
      id: `${team.id}-deadline`,
      title: '다음 체크포인트',
      description: `${hackathon.title} 제출 마감 전까지 핵심 산출물과 데모 링크를 점검해야 합니다.`,
      timestamp: hackathon.submissionDeadline,
    });
  }

  return feed;
}

export function getTeamCheckpointItems(team: Team, submission: Submission | null) {
  const checkpoints = [
    team.desiredRoles.length > 0
      ? `필요 역할 ${team.desiredRoles.map((role) => ROLE_LABEL_MAP[role]).join(', ')} 충원 여부를 확정합니다.`
      : '현재 인원 기준 역할 분담을 최종 확정합니다.',
    team.techTags.length > 0
      ? `${team.techTags.join(', ')} 기준으로 핵심 구현 범위를 다시 점검합니다.`
      : '기술 스택과 MVP 범위를 다시 정리합니다.',
    submission
      ? '제출 초안, 배포 링크, GitHub 저장소를 함께 검수합니다.'
      : '기획서, 배포 구조, 제출 준비 순서를 먼저 맞춥니다.',
  ];

  return checkpoints;
}

export function getNextAction(
  user: AppUser | null,
  activeHackathon: Hackathon | null,
  team: Team | null,
  submission: Submission | null
) {
  if (!user) {
    return {
      title: '로그인하고 역할을 설정하세요',
      description: '역할을 설정하면 팀 적합도와 다음 행동 가이드를 바로 보여줍니다.',
      ctaLabel: '로그인',
      route: null,
    };
  }

  if (!activeHackathon) {
    return {
      title: '진행 중인 해커톤을 탐색하세요',
      description: '가까운 마감과 모집 중 팀을 기준으로 우선순위를 정할 수 있습니다.',
      ctaLabel: '해커톤 보러가기',
      route: '/hackathons',
    };
  }

  if (!team) {
    return {
      title: '팀을 찾거나 직접 만드세요',
      description: `${activeHackathon.title} 제출 전에는 팀 구성이 먼저입니다.`,
      ctaLabel: '팀 모집 보기',
      route: '/camp',
    };
  }

  if (!submission) {
    return {
      title: '제출 초안을 먼저 저장하세요',
      description: '기획서 링크, 배포 URL, GitHub 저장소, 솔루션 PDF를 단계별로 채우면 됩니다.',
      ctaLabel: '제출 탭 보기',
      route: `/hackathons/${activeHackathon.slug}`,
    };
  }

  if (submission.status === 'draft') {
    return {
      title: '최종 제출 전 체크리스트를 확인하세요',
      description: '형식 검증과 마감 시각을 확인한 뒤 최종 제출을 완료하세요.',
      ctaLabel: '제출 마무리',
      route: `/hackathons/${activeHackathon.slug}`,
    };
  }

  return {
    title: '리더보드에서 현재 순위를 확인하세요',
    description: '제출 완료 후에는 순위와 산출물 링크를 점검하는 단계입니다.',
    ctaLabel: '리더보드 보기',
    route: `/hackathons/${activeHackathon.slug}`,
  };
}
