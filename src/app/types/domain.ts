export const roleValues = [
  'frontend',
  'backend',
  'designer',
  'planner',
  'pm',
  'data-ai',
  'smart-contract',
] as const;

export type UserRole = (typeof roleValues)[number];

export type HackathonStatus = 'upcoming' | 'active' | 'ended';
export type TimelineStatus = 'completed' | 'upcoming';
export type SubmissionStatus = 'draft' | 'submitted';
export type RankingPeriod = '7d' | '30d' | 'all';

export interface NextAction {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface RankingSummary {
  rank: number;
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  submissions: number;
  lastActive: string;
  trend: 'up' | 'down' | 'same';
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  primaryRole: UserRole | null;
  isAdmin?: boolean;
  isDemo?: boolean;
}

export interface GuideLink {
  label: string;
  url: string;
}

export interface EvaluationCriterion {
  id: string;
  label: string;
  weight: number;
  description: string;
}

export interface PrizeEntry {
  rank: number;
  title: string;
  amount: string;
  description: string;
}

export interface ScheduleItem {
  date: string;
  title: string;
  description: string;
  status: TimelineStatus;
}

export interface Hackathon {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  summary: string;
  description: string;
  status: HackathonStatus;
  location: string;
  tags: string[];
  submissionDeadline: string;
  eventEndAt: string;
  participants: number;
  teamCount: number;
  teamMinSize: number;
  teamMaxSize: number;
  published: boolean;
  guideLinks: GuideLink[];
  guideItems: string[];
  evaluationCriteria: EvaluationCriterion[];
  prizes: PrizeEntry[];
  schedule: ScheduleItem[];
  teamPolicy: string[];
}

export interface TeamMember {
  profileId: string;
  displayName: string;
  roleLabel: string;
  isOwner: boolean;
}

export interface Team {
  id: string;
  hackathonId: string;
  ownerId: string;
  name: string;
  description: string;
  currentSize: number;
  maxSize: number;
  isRecruiting: boolean;
  desiredRoles: UserRole[];
  techTags: string[];
  contactUrl: string;
  updatedAt: string;
  members: TeamMember[];
}

export interface SubmissionVersion {
  versionNumber: number;
  proposalSummary: string;
  proposalUrl: string;
  deployUrl: string;
  githubUrl: string;
  solutionPdfUrl: string;
  solutionPdfPath: string;
  demoVideoUrl: string;
  savedAt: string;
}

export interface Submission {
  id: string;
  hackathonId: string;
  teamId: string;
  proposalSummary: string;
  proposalUrl: string;
  deployUrl: string;
  githubUrl: string;
  solutionPdfUrl: string;
  solutionPdfPath: string;
  demoVideoUrl: string;
  status: SubmissionStatus;
  updatedAt: string;
  finalSubmittedAt: string | null;
  versions: SubmissionVersion[];
}

export interface LeaderboardEntry {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  rank: number;
  totalScore: number;
  participantScore: number;
  judgeScore: number;
  submittedAt: string;
  projectUrl: string;
}

export interface TeamFormInput {
  id?: string;
  hackathonId: string;
  name: string;
  description: string;
  currentSize: number;
  maxSize: number;
  isRecruiting: boolean;
  desiredRoles: UserRole[];
  techTags: string[];
  contactUrl: string;
}

export interface SubmissionFormInput {
  hackathonId: string;
  teamId: string;
  proposalSummary: string;
  proposalUrl: string;
  deployUrl: string;
  githubUrl: string;
  solutionPdfUrl: string;
  solutionPdfPath: string;
  demoVideoUrl: string;
}

export interface BootstrapData {
  hackathons: Hackathon[];
  teams: Team[];
  submissions: Submission[];
  leaderboardEntries: LeaderboardEntry[];
}
