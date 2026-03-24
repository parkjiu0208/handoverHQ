import {
  type PropsWithChildren,
  startTransition,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';
import { AppContext, type AuthRequestInput } from '../hooks/useAppContext';
import { appEnv } from '../lib/env';
import {
  loadBootstrapData,
  mapSupabaseUser,
  saveSubmission,
  saveTeam as persistTeam,
  upsertProfile,
} from '../lib/repository';
import { getSupabaseBrowserClient } from '../lib/supabase';
import { authRequestSchema, submissionFormSchema, teamFormSchema } from '../lib/validators';
import { useAppStore } from '../stores/useAppStore';
import type {
  AppUser,
  BootstrapData,
  Hackathon,
  NextAction,
  RankingSummary,
  Submission,
  SubmissionFormInput,
  Team,
  TeamFormInput,
  UserRole,
} from '../types/domain';

const emptyData: BootstrapData = {
  hackathons: [],
  teams: [],
  submissions: [],
  leaderboardEntries: [],
};

function buildRankings(entries: BootstrapData['leaderboardEntries']): RankingSummary[] {
  const aggregated = new Map<string, RankingSummary>();

  entries.forEach((entry) => {
    const current = aggregated.get(entry.teamId);
    if (!current) {
      aggregated.set(entry.teamId, {
        rank: 0,
        teamId: entry.teamId,
        teamName: entry.teamName,
        points: Math.round(entry.totalScore * 10),
        wins: entry.rank === 1 ? 1 : 0,
        submissions: 1,
        lastActive: entry.submittedAt,
        trend: entry.rank === 1 ? 'up' : entry.rank > 3 ? 'same' : 'up',
      });
      return;
    }

    aggregated.set(entry.teamId, {
      ...current,
      points: current.points + Math.round(entry.totalScore * 10),
      wins: current.wins + (entry.rank === 1 ? 1 : 0),
      submissions: current.submissions + 1,
      lastActive: current.lastActive > entry.submittedAt ? current.lastActive : entry.submittedAt,
    });
  });

  return [...aggregated.values()]
    .sort((left, right) => right.points - left.points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function AppProvider({ children }: PropsWithChildren) {
  const demoUser = useAppStore((state) => state.demoUser);
  const preferredRole = useAppStore((state) => state.preferredRole);
  const persistDemoUser = useAppStore((state) => state.setDemoUser);
  const persistPreferredRole = useAppStore((state) => state.setPreferredRole);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(demoUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [data, setData] = useState<BootstrapData>(emptyData);
  const rankings = buildRankings(data.leaderboardEntries);

  async function refreshData() {
    setDataLoading(true);
    const nextData = await loadBootstrapData();

    startTransition(() => {
      setData(nextData);
      setDataLoading(false);
    });
  }

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function initialize() {
      if (!appEnv.hasSupabase) {
        if (!mounted) return;
        setCurrentUser(demoUser);
        setAuthLoading(false);
        await refreshData();
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setAuthLoading(false);
        await refreshData();
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;

      const nextUser = sessionData.session?.user ? mapSupabaseUser(sessionData.session.user) : null;
      setCurrentUser(nextUser);
      setAuthLoading(false);
      await refreshData();

      const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const sessionUser = session?.user ? mapSupabaseUser(session.user) : null;
        setCurrentUser(sessionUser);
        await refreshData();
      });

      unsubscribe = () => {
        authSubscription.subscription.unsubscribe();
      };
    }

    void initialize();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [demoUser]);

  useEffect(() => {
    if (!appEnv.hasSupabase) {
      setCurrentUser(demoUser);
    }
  }, [demoUser]);

  async function requestAuth(input: AuthRequestInput) {
    const parsed = authRequestSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? '로그인 정보를 다시 확인해주세요.');
      return;
    }

    persistPreferredRole(parsed.data.primaryRole);

    if (!appEnv.hasSupabase) {
      const nextDemoUser: AppUser = {
        id: `demo-${parsed.data.email}`,
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        primaryRole: parsed.data.primaryRole,
        isDemo: true,
      };
      persistDemoUser(nextDemoUser);
      setCurrentUser(nextDemoUser);
      setAuthDialogOpen(false);
      toast.success('데모 로그인 상태로 전환했습니다.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase 설정을 확인해주세요.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('매직링크를 전송했습니다. 메일함을 확인해주세요.');
    setAuthDialogOpen(false);
  }

  async function signInWithGitHub() {
    if (!appEnv.hasSupabase) {
      toast.message('현재는 데모 모드입니다. 이메일 기반 데모 로그인을 사용해주세요.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase 설정을 확인해주세요.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  async function signOut() {
    if (!appEnv.hasSupabase) {
      persistDemoUser(null);
      setCurrentUser(null);
      toast.success('로그아웃했습니다.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success('로그아웃했습니다.');
  }

  async function ensureAuthenticatedUser() {
    if (!currentUser) {
      setAuthDialogOpen(true);
      throw new Error('AUTH_REQUIRED');
    }

    const nextUser = {
      ...currentUser,
      primaryRole: currentUser.primaryRole ?? preferredRole,
    };

    if (appEnv.hasSupabase) {
      await upsertProfile(nextUser);
    }

    return nextUser;
  }

  async function saveTeam(input: TeamFormInput) {
    try {
      const parsed = teamFormSchema.safeParse(input);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? '팀 정보를 다시 확인해주세요.');
        return;
      }

      const nextUser = await ensureAuthenticatedUser();
      await persistTeam(parsed.data, nextUser);
      await refreshData();
      toast.success(parsed.data.id ? '팀 정보를 수정했습니다.' : '새 팀을 등록했습니다.');
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        return;
      }
      toast.error('팀 정보를 저장하지 못했습니다.');
    }
  }

  async function commitSubmission(input: SubmissionFormInput, finalize: boolean) {
    try {
      const parsed = submissionFormSchema.safeParse(input);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? '제출 정보를 다시 확인해주세요.');
        return;
      }

      await ensureAuthenticatedUser();
      const currentSubmission: Submission | null =
        data.submissions.find(
          (submission) =>
            submission.hackathonId === parsed.data.hackathonId &&
            submission.teamId === parsed.data.teamId
        ) ?? null;

      await saveSubmission(parsed.data, currentSubmission, finalize);
      await refreshData();
      toast.success(finalize ? '최종 제출을 완료했습니다.' : '제출 초안을 저장했습니다.');
    } catch (error) {
      if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
        return;
      }
      toast.error(finalize ? '최종 제출에 실패했습니다.' : '초안 저장에 실패했습니다.');
    }
  }

  function getHackathonBySlug(slug: string): Hackathon | null {
    return data.hackathons.find((hackathon) => hackathon.slug === slug) ?? null;
  }

  function getMyTeamForHackathon(slug: string): Team | null {
    const targetHackathon = getHackathonBySlug(slug);
    if (!targetHackathon || !currentUser) {
      return null;
    }

    return (
      data.teams.find(
        (team) =>
          team.hackathonId === targetHackathon.id &&
          (team.ownerId === currentUser.id || team.members.some((member) => member.profileId === currentUser.id))
      ) ?? null
    );
  }

  function getSubmissionForHackathon(slug: string): Submission | null {
    const myTeam = getMyTeamForHackathon(slug);
    if (!myTeam) {
      return null;
    }

    return data.submissions.find((submission) => submission.teamId === myTeam.id) ?? null;
  }

  function computeTeamFit(desiredRoles: UserRole[]) {
    const selectedRole = currentUser?.primaryRole ?? preferredRole;
    if (!selectedRole || desiredRoles.length === 0) {
      return null;
    }

    if (desiredRoles.includes(selectedRole)) {
      return 100;
    }

    return desiredRoles.length > 1 ? 50 : 25;
  }

  function getNextAction(): NextAction {
    const activeHackathon = data.hackathons.find((hackathon) => hackathon.status === 'active');

    if (!currentUser) {
      return {
        title: '로그인하고 팀을 정리하세요',
        description: '관심 역할을 저장하면 Team Fit, 내 제출 상태, 다음 행동 카드가 개인화됩니다.',
        ctaLabel: '로그인',
        href: '#auth',
      };
    }

    if (!activeHackathon) {
      return {
        title: '다음 대회를 탐색하세요',
        description: '예정된 해커톤을 둘러보고 팀 빌딩을 먼저 시작해두면 제출 흐름이 훨씬 수월합니다.',
        ctaLabel: '해커톤 탐색',
        href: '/hackathons',
      };
    }

    const myTeam = getMyTeamForHackathon(activeHackathon.slug);
    if (!myTeam) {
      return {
        title: '먼저 팀을 만들거나 합류하세요',
        description: '진행 중인 해커톤에 연결된 팀이 있어야 제출 초안과 리더보드 흐름이 활성화됩니다.',
        ctaLabel: '팀 모집 보기',
        href: '/camp',
      };
    }

    const mySubmission = getSubmissionForHackathon(activeHackathon.slug);
    if (!mySubmission || mySubmission.status === 'draft') {
      return {
        title: '제출 준비를 마무리하세요',
        description: `${activeHackathon.title} 제출 탭에서 배포 URL, GitHub, PDF까지 연결하면 심사 준비가 끝납니다.`,
        ctaLabel: '제출 관리',
        href: `/hackathons/${activeHackathon.slug}`,
      };
    }

    return {
      title: '리더보드 상태를 점검하세요',
      description: '최종 제출이 완료됐습니다. 순위, 점수, 산출물 링크를 한 번 더 확인해두세요.',
      ctaLabel: '리더보드 보기',
      href: `/hackathons/${activeHackathon.slug}`,
    };
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        dataLoading,
        isSupabaseReady: appEnv.hasSupabase,
        authDialogOpen,
        hackathons: data.hackathons,
        teams: data.teams,
        submissions: data.submissions,
        leaderboardEntries: data.leaderboardEntries,
        rankings,
        preferredRole,
        openAuthDialog: () => setAuthDialogOpen(true),
        closeAuthDialog: () => setAuthDialogOpen(false),
        requestAuth,
        signInWithGitHub,
        signOut,
        refreshData,
        saveTeam,
        saveSubmissionDraft: (input) => commitSubmission(input, false),
        finalizeSubmission: (input) => commitSubmission(input, true),
        setPreferredRole: (role: UserRole | null) => persistPreferredRole(role),
        getHackathonBySlug,
        getMyTeamForHackathon,
        getSubmissionForHackathon,
        computeTeamFit,
        getNextAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
