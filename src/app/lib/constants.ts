import type { UserRole } from '../types/domain';

export const STORAGE_KEYS = {
  profile: 'handoverhq.profile',
  teams: 'handoverhq.teams',
  submissions: 'handoverhq.submissions',
  leaderboards: 'handoverhq.leaderboards',
} as const;

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'frontend', label: '프론트엔드' },
  { value: 'backend', label: '백엔드' },
  { value: 'designer', label: '디자이너' },
  { value: 'planner', label: '서비스 기획' },
  { value: 'pm', label: 'PM' },
  { value: 'data-ai', label: '데이터 / AI' },
  { value: 'smart-contract', label: '스마트 컨트랙트' },
];

export const ROLE_LABEL_MAP: Record<UserRole, string> = ROLE_OPTIONS.reduce(
  (accumulator, current) => {
    accumulator[current.value] = current.label;
    return accumulator;
  },
  {} as Record<UserRole, string>
);

export const PERIOD_OPTIONS = [
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: 'all', label: '전체 기간' },
] as const;
