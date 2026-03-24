import { ROLE_LABEL_MAP } from './constants';
import type {
  AppUser,
  Hackathon,
  HackathonStatus,
  Submission,
  SubmissionStatus,
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
