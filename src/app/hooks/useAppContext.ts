import { createContext, useContext } from 'react';
import type {
  AppUser,
  Hackathon,
  LeaderboardEntry,
  NextAction,
  RankingSummary,
  Submission,
  SubmissionFormInput,
  Team,
  TeamFormInput,
  TeamJoinRequest,
  TeamJoinRequestFormInput,
  UserRole,
} from '../types/domain';

export interface AuthRequestInput {
  email: string;
  displayName: string;
  primaryRole: UserRole | null;
}

export interface OAuthRequestInput {
  email?: string;
  displayName?: string;
  primaryRole?: UserRole | null;
}

export interface AppContextValue {
  currentUser: AppUser | null;
  authLoading: boolean;
  dataLoading: boolean;
  isSupabaseReady: boolean;
  authDialogOpen: boolean;
  hackathons: Hackathon[];
  teams: Team[];
  joinRequests: TeamJoinRequest[];
  submissions: Submission[];
  leaderboardEntries: LeaderboardEntry[];
  rankings: RankingSummary[];
  preferredRole: UserRole | null;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  requestAuth: (input: AuthRequestInput) => Promise<void>;
  signInWithGitHub: (input?: OAuthRequestInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  saveTeam: (input: TeamFormInput) => Promise<void>;
  requestTeamJoin: (input: TeamJoinRequestFormInput) => Promise<boolean>;
  cancelTeamJoinRequest: (requestId: string) => Promise<void>;
  reviewTeamJoinRequest: (requestId: string, status: 'accepted' | 'rejected') => Promise<void>;
  saveSubmissionDraft: (input: SubmissionFormInput) => Promise<void>;
  finalizeSubmission: (input: SubmissionFormInput) => Promise<void>;
  uploadSubmissionPdf: (file: File, payload: { hackathonId: string; teamId: string }) => Promise<{ path: string; url: string }>;
  setPreferredRole: (role: UserRole | null) => void;
  getHackathonBySlug: (slug: string) => Hackathon | null;
  getMyTeamForHackathon: (slug: string) => Team | null;
  getSubmissionForHackathon: (slug: string) => Submission | null;
  computeTeamFit: (desiredRoles: UserRole[]) => number | null;
  getNextAction: () => NextAction;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
