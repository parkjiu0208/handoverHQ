import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowSquareOut,
  Calendar,
  CaretRight,
  CheckCircle,
  Clock,
  FileText,
  Info,
  ShieldCheck,
  Trophy,
  Users,
  Warning,
} from '@phosphor-icons/react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { ROLE_LABEL_MAP } from '../lib/constants';
import { formatDateTime, formatKoreanDate, getDdayLabel } from '../lib/date';
import { getHackathonStatusLabel, getSubmissionStatusLabel } from '../lib/presentation';
import { cn } from '../lib/utils';
import { submissionFormSchema } from '../lib/validators';
import type { SubmissionFormInput } from '../types/domain';

const tabs = [
  { id: 'overview', label: '개요' },
  { id: 'guide', label: '안내' },
  { id: 'evaluation', label: '평가' },
  { id: 'prizes', label: '상금' },
  { id: 'schedule', label: '일정' },
  { id: 'teams', label: '팀' },
  { id: 'submit', label: '제출' },
  { id: 'leaderboard', label: '리더보드' },
] as const;

type DetailTab = (typeof tabs)[number]['id'];

function readLocalDraft(slug: string): Partial<SubmissionFormInput> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(`handoverhq.submit-draft.${slug}`);
    return raw ? (JSON.parse(raw) as Partial<SubmissionFormInput>) : {};
  } catch {
    return {};
  }
}

function getFitLabel(score: number | null) {
  if (score === null) return '역할 설정 필요';
  if (score >= 100) return '높음';
  if (score >= 50) return '보통';
  return '낮음';
}

export function HackathonDetail() {
  const { slug = '' } = useParams();
  const {
    currentUser,
    dataLoading,
    hackathons,
    teams,
    leaderboardEntries,
    openAuthDialog,
    getHackathonBySlug,
    getMyTeamForHackathon,
    getSubmissionForHackathon,
    saveSubmissionDraft,
    finalizeSubmission,
    computeTeamFit,
    getNextAction,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hackathon = getHackathonBySlug(slug);
  const myTeam = hackathon ? getMyTeamForHackathon(hackathon.slug) : null;
  const savedSubmission = hackathon ? getSubmissionForHackathon(hackathon.slug) : null;
  const localDraft = useMemo(() => readLocalDraft(slug), [slug]);
  const nextAction = getNextAction();

  const teamList = useMemo(() => {
    if (!hackathon) {
      return [];
    }

    return [...teams]
      .filter((team) => team.hackathonId === hackathon.id)
      .sort((left, right) => Number(right.isRecruiting) - Number(left.isRecruiting));
  }, [hackathon, teams]);

  const leaderboard = useMemo(() => {
    if (!hackathon) {
      return [];
    }

    return [...leaderboardEntries]
      .filter((entry) => entry.hackathonId === hackathon.id)
      .sort((left, right) => left.rank - right.rank || right.totalScore - left.totalScore);
  }, [hackathon, leaderboardEntries]);

  const defaultValues = useMemo<SubmissionFormInput>(
    () => ({
      hackathonId: hackathon?.id ?? '',
      teamId: myTeam?.id ?? '',
      proposalSummary: savedSubmission?.proposalSummary ?? localDraft.proposalSummary ?? '',
      proposalUrl: savedSubmission?.proposalUrl ?? localDraft.proposalUrl ?? '',
      deployUrl: savedSubmission?.deployUrl ?? localDraft.deployUrl ?? '',
      githubUrl: savedSubmission?.githubUrl ?? localDraft.githubUrl ?? '',
      solutionPdfUrl: savedSubmission?.solutionPdfUrl ?? localDraft.solutionPdfUrl ?? '',
      demoVideoUrl: savedSubmission?.demoVideoUrl ?? localDraft.demoVideoUrl ?? '',
    }),
    [hackathon?.id, localDraft, myTeam?.id, savedSubmission]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormInput>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues,
  });

  const watchedValues = watch();
  const checklistState = [
    { label: '프로젝트 요약', completed: Boolean(watchedValues.proposalSummary) },
    { label: '기획서 URL', completed: Boolean(watchedValues.proposalUrl) },
    { label: '배포 URL', completed: Boolean(watchedValues.deployUrl) },
    { label: 'GitHub URL', completed: Boolean(watchedValues.githubUrl) },
    { label: '솔루션 PDF URL', completed: Boolean(watchedValues.solutionPdfUrl) },
  ];

  const isFinalized = savedSubmission?.status === 'submitted';
  const isLocked = isFinalized || hackathon?.status === 'ended';

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (typeof window === 'undefined' || !slug) {
      return;
    }

    window.localStorage.setItem(
      `handoverhq.submit-draft.${slug}`,
      JSON.stringify({
        ...watchedValues,
        hackathonId: hackathon?.id ?? '',
        teamId: myTeam?.id ?? '',
      })
    );
  }, [hackathon?.id, myTeam?.id, slug, watchedValues]);

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  if (!hackathon) {
    return (
      <div className="bg-[#EEF3F8] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            icon={Info}
            title="해커톤을 찾을 수 없습니다"
            description="경로가 바뀌었거나 아직 데이터가 준비되지 않았습니다."
            action={{ label: '목록으로 돌아가기', onClick: () => window.history.back() }}
          />
        </div>
      </div>
    );
  }

  const handleSaveDraft = handleSubmit(async (values) => {
    if (!myTeam) {
      return;
    }

    await saveSubmissionDraft({
      ...values,
      hackathonId: hackathon.id,
      teamId: myTeam.id,
    });
  });

  const handleFinalize = handleSubmit(async (values) => {
    if (!myTeam) {
      return;
    }

    await finalizeSubmission({
      ...values,
      hackathonId: hackathon.id,
      teamId: myTeam.id,
    });
    setConfirmOpen(false);
  });

  return (
    <div className="min-h-screen w-full bg-[#EEF3F8] pb-24 text-[#0F1E32]">
      <div className="sticky top-0 z-20 bg-white/95 px-6 pb-0 pt-8 shadow-sm backdrop-blur-md lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-2 text-xs font-bold text-[#5F6E82]">
            <Link to="/hackathons" className="transition-colors hover:text-[#0F1E32]">
              해커톤 목록
            </Link>
            <CaretRight size={14} className="text-[#D6DEE8]" />
            <span className="text-[#0064FF]">{hackathon.title}</span>
          </div>

          <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge
                  variant={
                    hackathon.status === 'active'
                      ? 'active'
                      : hackathon.status === 'upcoming'
                        ? 'upcoming'
                        : 'ended'
                  }
                >
                  {getHackathonStatusLabel(hackathon.status)}
                </Badge>
                <span className="text-xs font-bold text-[#5F6E82]">{hackathon.organizer}</span>
                <span className="rounded-full bg-[#EEF3F8] px-3 py-1 text-xs font-bold text-[#0F1E32]">
                  {getDdayLabel(hackathon.submissionDeadline)}
                </span>
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#0F1E32] lg:text-5xl">{hackathon.title}</h1>
              <p className="max-w-3xl text-base leading-7 text-[#5F6E82]">{hackathon.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {hackathon.tags.map((tag) => (
                  <span key={tag} className="rounded-xl bg-[#F6F9FC] px-3 py-1.5 text-xs font-bold text-[#0F1E32] shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#05060B] p-6 text-white shadow-lg">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-white/50">Hackathon Snapshot</div>
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/60">제출 마감</span>
                  <span className="text-right font-bold">{formatDateTime(hackathon.submissionDeadline)}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/60">진행 종료</span>
                  <span className="text-right font-bold">{formatDateTime(hackathon.eventEndAt)}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-white/60">팀 구성</span>
                  <span className="text-right font-bold">
                    {hackathon.teamMinSize}명 ~ {hackathon.teamMaxSize}명
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 py-4 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                  activeTab === tab.id
                    ? 'border-[#0064FF] text-[#0064FF]'
                    : 'border-transparent text-[#5F6E82] hover:text-[#0F1E32]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-12 lg:px-10">
        <div className="space-y-6 lg:col-span-8">
          {activeTab === 'overview' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <h2 className="mb-6 text-xl font-bold text-[#0F1E32]">개요</h2>
              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-4 text-base leading-7 text-[#0F1E32]">
                  <p>{hackathon.description}</p>
                  {hackathon.teamPolicy.length > 0 && (
                    <div className="rounded-2xl bg-[#F6F9FC] p-5">
                      <div className="mb-3 text-sm font-bold text-[#0F1E32]">팀 운영 정책</div>
                      <ul className="space-y-2 text-sm text-[#5F6E82]">
                        {hackathon.teamPolicy.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-[#F6F9FC] p-5">
                    <div className="text-sm text-[#5F6E82]">참가자 수</div>
                    <div className="mt-2 text-3xl font-bold text-[#0F1E32]">{hackathon.participants}</div>
                  </div>
                  <div className="rounded-2xl bg-[#F6F9FC] p-5">
                    <div className="text-sm text-[#5F6E82]">등록 팀</div>
                    <div className="mt-2 text-3xl font-bold text-[#0F1E32]">{teamList.length}</div>
                  </div>
                  <div className="rounded-2xl bg-[#F6F9FC] p-5">
                    <div className="text-sm text-[#5F6E82]">장소</div>
                    <div className="mt-2 text-lg font-bold text-[#0F1E32]">{hackathon.location}</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6">
              <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
                <h2 className="mb-6 text-xl font-bold text-[#0F1E32]">참가 안내</h2>
                {hackathon.guideItems.length === 0 ? (
                  <EmptyState
                    icon={Info}
                    title="안내 문서가 아직 없습니다"
                    description="운영자가 가이드를 등록하면 이 영역에 바로 반영됩니다."
                  />
                ) : (
                  <div className="space-y-3">
                    {hackathon.guideItems.map((item) => (
                      <div key={item} className="rounded-2xl bg-[#F6F9FC] p-4 text-sm leading-6 text-[#5F6E82]">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
                <h2 className="mb-6 text-xl font-bold text-[#0F1E32]">가이드 링크</h2>
                {hackathon.guideLinks.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="공개된 가이드 링크가 없습니다"
                    description="운영 문서 링크는 추후 등록될 수 있습니다."
                  />
                ) : (
                  <div className="space-y-3">
                    {hackathon.guideLinks.map((item) => (
                      <a
                        key={item.url}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-[#D6DEE8] p-4 transition-colors hover:border-[#0064FF]/40 hover:bg-[#F6F9FC]"
                      >
                        <span className="font-bold text-[#0F1E32]">{item.label}</span>
                        <ArrowSquareOut size={18} className="text-[#0064FF]" />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <h2 className="mb-8 text-xl font-bold text-[#0F1E32]">평가 기준</h2>
              {hackathon.evaluationCriteria.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="평가 기준이 아직 공개되지 않았습니다"
                  description="운영자가 평가 항목을 등록하면 이 영역에서 확인할 수 있습니다."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#EEF3F8] text-[#5F6E82]">
                      <tr>
                        <th className="px-6 py-4 font-bold">항목</th>
                        <th className="px-6 py-4 font-bold">비중</th>
                        <th className="px-6 py-4 font-bold">설명</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F6F9]">
                      {hackathon.evaluationCriteria.map((criterion) => (
                        <tr key={criterion.id}>
                          <td className="px-6 py-5 font-bold text-[#0F1E32]">{criterion.label}</td>
                          <td className="px-6 py-5 text-lg font-bold text-[#0064FF]">{criterion.weight}%</td>
                          <td className="px-6 py-5 text-[#5F6E82]">{criterion.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'prizes' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0F1E32]">시상 내역</h2>
                <Trophy size={22} className="text-[#0064FF]" />
              </div>
              {hackathon.prizes.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="상금 정보가 아직 없습니다"
                  description="운영자가 시상 내역을 공개하면 이 영역에 표시됩니다."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {hackathon.prizes.map((prize) => (
                    <div key={prize.rank} className="rounded-2xl border border-[#D6DEE8] bg-[#F6F9FC] p-6">
                      <div className="mb-2 text-sm font-bold text-[#0064FF]">{prize.rank}위</div>
                      <div className="text-xl font-bold text-[#0F1E32]">{prize.title}</div>
                      <div className="mt-3 text-3xl font-bold text-[#0F1E32]">{prize.amount}</div>
                      <div className="mt-2 text-sm leading-6 text-[#5F6E82]">{prize.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <h2 className="mb-8 text-xl font-bold text-[#0F1E32]">진행 일정</h2>
              {hackathon.schedule.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="등록된 일정이 없습니다"
                  description="오리엔테이션, 마감일, 결과 발표 일정이 여기에 표시됩니다."
                />
              ) : (
                <div className="relative ml-2 space-y-10 border-l-2 border-[#F6F9FC] pb-4 pl-6">
                  {hackathon.schedule.map((item) => (
                    <div key={`${item.date}-${item.title}`} className="relative">
                      <div
                        className={cn(
                          'absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 shadow-sm',
                          item.status === 'completed' ? 'border-[#0064FF] bg-[#0064FF]' : 'border-[#D6DEE8] bg-white'
                        )}
                      />
                      <div className="pl-4">
                        <div className={cn('mb-1 text-sm font-bold', item.status === 'completed' ? 'text-[#0064FF]' : 'text-[#5F6E82]')}>
                          {formatDateTime(item.date)}
                        </div>
                        <div className="text-lg font-bold text-[#0F1E32]">{item.title}</div>
                        <div className="mt-2 text-sm leading-6 text-[#5F6E82]">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'teams' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0F1E32]">팀 모집 현황</h2>
                <span className="rounded-lg bg-[#EEF3F8] px-4 py-1.5 text-sm font-bold text-[#0F1E32]">{teamList.length}팀</span>
              </div>

              {teamList.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="아직 등록된 팀이 없습니다"
                  description="팀 모집 화면에서 새 팀을 만들면 이 섹션에도 바로 반영됩니다."
                  action={{ label: '팀 모집으로 이동', onClick: () => window.location.assign('/camp') }}
                />
              ) : (
                <div className="space-y-4">
                  {teamList.map((team) => {
                    const fitScore = computeTeamFit(team.desiredRoles);
                    return (
                      <div key={team.id} className="rounded-2xl border border-[#EEF3F8] bg-[#F6F9FC] p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-[#0F1E32]">{team.name}</h3>
                            <div className="mt-1 text-sm text-[#5F6E82]">
                              {team.currentSize} / {team.maxSize}명 · 업데이트 {formatDateTime(team.updatedAt)}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={team.isRecruiting ? 'recruiting' : 'ended'}>
                              {team.isRecruiting ? '모집중' : '마감'}
                            </Badge>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0F1E32]">
                              Team Fit {getFitLabel(fitScore)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm leading-6 text-[#5F6E82]">{team.description}</p>

                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                          <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5F6E82]">필요 역할</div>
                            <div className="flex flex-wrap gap-2">
                              {team.desiredRoles.length > 0 ? (
                                team.desiredRoles.map((role) => (
                                  <span key={role} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#0F1E32]">
                                    {ROLE_LABEL_MAP[role]}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#5F6E82]">추가 모집 없음</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5F6E82]">기술 태그</div>
                            <div className="flex flex-wrap gap-2">
                              {team.techTags.length > 0 ? (
                                team.techTags.map((tag) => (
                                  <span key={tag} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#0F1E32]">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#5F6E82]">등록된 태그 없음</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5F6E82]">팀 구성</div>
                            <div className="space-y-2">
                              {team.members.map((member) => (
                                <div key={`${team.id}-${member.profileId}`} className="rounded-lg bg-white px-3 py-2 text-xs text-[#0F1E32]">
                                  <span className="font-bold">{member.displayName}</span>
                                  <span className="text-[#5F6E82]"> · {member.roleLabel}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <a
                            href={team.contactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-bold text-[#0F1E32] shadow-sm transition-colors hover:bg-[#F6F9FC]"
                          >
                            연락 링크
                            <ArrowSquareOut size={16} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'submit' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0F1E32]">프로젝트 제출</h2>
                  <p className="mt-2 text-sm text-[#5F6E82]">
                    임시 저장과 최종 제출은 팀 기준으로 관리되며, 최종 제출 후에는 수정이 잠깁니다.
                  </p>
                </div>
                {savedSubmission && (
                  <Badge variant={savedSubmission.status === 'submitted' ? 'submitted' : 'default'}>
                    {getSubmissionStatusLabel(savedSubmission.status)}
                  </Badge>
                )}
              </div>

              {!currentUser ? (
                <EmptyState
                  icon={Warning}
                  title="로그인이 필요합니다"
                  description="제출 상태, 버전 이력, 최종 제출은 인증 후에만 사용할 수 있습니다."
                  action={{ label: '로그인', onClick: openAuthDialog }}
                />
              ) : !myTeam ? (
                <EmptyState
                  icon={Users}
                  title="먼저 팀을 만들어주세요"
                  description="팀이 있어야 제출 초안과 최종 제출을 연결할 수 있습니다."
                  action={{ label: '팀 모집으로 이동', onClick: () => window.location.assign('/camp') }}
                />
              ) : (
                <>
                  <div className="mb-8 grid gap-4 lg:grid-cols-2">
                    <div className="flex items-start gap-4 rounded-2xl bg-blue-50 p-5">
                      <ShieldCheck className="mt-0.5 shrink-0 text-[#0064FF]" size={22} />
                      <div>
                        <h3 className="mb-2 text-sm font-bold text-[#0F1E32]">Submit Guard</h3>
                        <ul className="space-y-1.5 text-sm text-[#5F6E82]">
                          <li>- 입력값은 브라우저 초안으로 자동 저장됩니다.</li>
                          <li>- GitHub, 배포, PDF 링크는 모두 공개 접근 가능해야 합니다.</li>
                          <li>- 최종 제출 후에는 운영자 재오픈 전까지 수정이 잠깁니다.</li>
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#D6DEE8] bg-[#F6F9FC] p-5">
                      <div className="mb-2 text-sm font-bold text-[#0F1E32]">제출 메타</div>
                      <div className="space-y-2 text-sm text-[#5F6E82]">
                        <div className="flex justify-between gap-4">
                          <span>연결 팀</span>
                          <span className="font-bold text-[#0F1E32]">{myTeam.name}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>마감 시각</span>
                          <span className="font-bold text-[#0F1E32]">{formatDateTime(hackathon.submissionDeadline)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>상태</span>
                          <span className="font-bold text-[#0F1E32]">
                            {savedSubmission ? getSubmissionStatusLabel(savedSubmission.status) : '아직 제출 없음'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                    <form className="space-y-6" onSubmit={handleSaveDraft}>
                      <input type="hidden" value={hackathon.id} {...register('hackathonId')} />
                      <input type="hidden" value={myTeam.id} {...register('teamId')} />

                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#0F1E32]">프로젝트 요약</label>
                        <textarea
                          disabled={isLocked}
                          className="min-h-[160px] w-full resize-y rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                          placeholder="프로젝트의 문제 정의, 핵심 기능, 차별점을 요약해주세요."
                          {...register('proposalSummary')}
                        />
                        {errors.proposalSummary && (
                          <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.proposalSummary.message}</p>
                        )}
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#0F1E32]">기획서 URL</label>
                          <input
                            type="url"
                            disabled={isLocked}
                            placeholder="https://"
                            className="w-full rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                            {...register('proposalUrl')}
                          />
                          {errors.proposalUrl && <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.proposalUrl.message}</p>}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#0F1E32]">배포 URL</label>
                          <input
                            type="url"
                            disabled={isLocked}
                            placeholder="https://"
                            className="w-full rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                            {...register('deployUrl')}
                          />
                          {errors.deployUrl && <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.deployUrl.message}</p>}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#0F1E32]">GitHub 저장소 URL</label>
                          <input
                            type="url"
                            disabled={isLocked}
                            placeholder="https://github.com/"
                            className="w-full rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                            {...register('githubUrl')}
                          />
                          {errors.githubUrl && <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.githubUrl.message}</p>}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-[#0F1E32]">솔루션 PDF URL</label>
                          <input
                            type="url"
                            disabled={isLocked}
                            placeholder="https://"
                            className="w-full rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                            {...register('solutionPdfUrl')}
                          />
                          {errors.solutionPdfUrl && (
                            <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.solutionPdfUrl.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-[#0F1E32]">시연 영상 URL</label>
                        <input
                          type="url"
                          disabled={isLocked}
                          placeholder="선택 입력"
                          className="w-full rounded-2xl border border-[#D6DEE8] p-4 text-sm outline-none transition-colors focus:border-[#0F1E32] focus:ring-4 focus:ring-[#DCEEFF] disabled:bg-[#F6F9FC] disabled:text-[#5F6E82]"
                          {...register('demoVideoUrl')}
                        />
                        {errors.demoVideoUrl && <p className="mt-2 text-xs font-medium text-[#D74A32]">{errors.demoVideoUrl.message}</p>}
                      </div>

                      {isFinalized && (
                        <div className="rounded-2xl border border-[#B5D6FF] bg-[#EBF5FF] p-5">
                          <div className="mb-1 text-sm font-bold text-[#0F1E32]">최종 제출 완료</div>
                          <p className="text-sm text-[#5F6E82]">
                            마지막 제출 시각 {savedSubmission?.finalSubmittedAt ? formatDateTime(savedSubmission.finalSubmittedAt) : '-'}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" variant="outline" disabled={isSubmitting || isLocked}>
                          임시 저장
                        </Button>
                        <Button type="button" disabled={isSubmitting || isLocked} onClick={() => setConfirmOpen(true)}>
                          최종 제출
                        </Button>
                      </div>
                    </form>

                    <aside className="space-y-5">
                      <div className="rounded-2xl bg-[#F6F9FC] p-5">
                        <div className="mb-4 text-sm font-bold text-[#0F1E32]">제출 체크리스트</div>
                        <div className="space-y-3">
                          {checklistState.map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                              <CheckCircle size={18} className={item.completed ? 'text-[#0064FF]' : 'text-[#D6DEE8]'} />
                              <span className="text-sm text-[#5F6E82]">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#F6F9FC] p-5">
                        <div className="mb-4 text-sm font-bold text-[#0F1E32]">버전 이력</div>
                        <div className="space-y-3">
                          {savedSubmission?.versions.length ? (
                            savedSubmission.versions.map((version) => (
                              <div key={`${savedSubmission.id}-${version.versionNumber}`} className="rounded-2xl bg-white p-4 shadow-sm">
                                <div className="mb-1 text-sm font-bold text-[#0F1E32]">버전 {version.versionNumber}</div>
                                <div className="text-xs text-[#5F6E82]">{formatDateTime(version.savedAt)}</div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl bg-white p-4 text-sm text-[#5F6E82]">아직 저장된 버전이 없습니다.</div>
                          )}
                        </div>
                      </div>
                    </aside>
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === 'leaderboard' && (
            <section className="rounded-2xl bg-white p-8 shadow-md lg:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0F1E32]">리더보드</h2>
                <span className="rounded-lg bg-[#EEF3F8] px-4 py-1.5 text-sm font-bold text-[#0F1E32]">{leaderboard.length}팀</span>
              </div>

              {leaderboard.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="아직 리더보드가 없습니다"
                  description="최종 제출이 생성되면 점수와 프로젝트 링크가 이 영역에 표시됩니다."
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#EEF3F8]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#EEF3F8] text-[#5F6E82]">
                        <tr>
                          <th className="px-5 py-4 font-bold">순위</th>
                          <th className="px-5 py-4 font-bold">팀명</th>
                          <th className="px-5 py-4 font-bold">총점</th>
                          <th className="px-5 py-4 font-bold">참가자</th>
                          <th className="px-5 py-4 font-bold">심사</th>
                          <th className="px-5 py-4 font-bold">최근 제출</th>
                          <th className="px-5 py-4 text-right font-bold">프로젝트</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF3F8]">
                        {leaderboard.map((entry) => (
                          <tr key={entry.id} className="hover:bg-[#F6F9FC]">
                            <td className="px-5 py-4 font-bold text-[#0F1E32]">{entry.rank}</td>
                            <td className="px-5 py-4 font-bold text-[#0F1E32]">{entry.teamName}</td>
                            <td className="px-5 py-4 font-bold text-[#0064FF]">{entry.totalScore.toFixed(1)}</td>
                            <td className="px-5 py-4 text-[#5F6E82]">{entry.participantScore.toFixed(1)}</td>
                            <td className="px-5 py-4 text-[#5F6E82]">{entry.judgeScore.toFixed(1)}</td>
                            <td className="px-5 py-4 text-[#5F6E82]">{formatKoreanDate(entry.submittedAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <a
                                href={entry.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-bold text-[#0064FF]"
                              >
                                보기
                                <ArrowSquareOut size={14} />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#0F1E32]">
              <Clock size={18} className="text-[#0064FF]" />
              마감 정보
            </div>
            <div className="mb-4 rounded-2xl bg-[#F6F9FC] p-5">
              <div className="text-xs font-medium text-[#5F6E82]">제출 마감</div>
              <div className="mt-1 text-2xl font-bold text-[#0F1E32]">{getDdayLabel(hackathon.submissionDeadline)}</div>
              <div className="mt-1 text-sm text-[#5F6E82]">{formatDateTime(hackathon.submissionDeadline)}</div>
            </div>
            <div className="space-y-3 text-sm text-[#5F6E82]">
              <div className="flex justify-between">
                <span>참여 인원</span>
                <span className="font-bold text-[#0F1E32]">{hackathon.participants}</span>
              </div>
              <div className="flex justify-between">
                <span>팀 수</span>
                <span className="font-bold text-[#0F1E32]">{teamList.length}</span>
              </div>
              <div className="flex justify-between">
                <span>위치</span>
                <span className="font-bold text-[#0F1E32]">{hackathon.location}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 text-sm font-bold text-[#0F1E32]">현재 상태</div>
            <div className="space-y-3 text-sm text-[#5F6E82]">
              <div className="flex justify-between gap-4">
                <span>로그인</span>
                <span className="font-bold text-[#0F1E32]">{currentUser ? '완료' : '필요'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>팀 연결</span>
                <span className="font-bold text-right text-[#0F1E32]">{myTeam ? myTeam.name : '미연결'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>제출 상태</span>
                <span className="font-bold text-right text-[#0F1E32]">
                  {savedSubmission ? getSubmissionStatusLabel(savedSubmission.status) : '아직 제출 없음'}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-4 text-sm font-bold text-[#0F1E32]">다음 행동</div>
            <div className="rounded-2xl bg-[#F6F9FC] p-5">
              <div className="text-lg font-bold text-[#0F1E32]">{nextAction.title}</div>
              <div className="mt-2 text-sm leading-6 text-[#5F6E82]">{nextAction.description}</div>
              <div className="mt-4">
                {nextAction.href === '#auth' ? (
                  <Button variant="outline" className="w-full" onClick={openAuthDialog}>
                    {nextAction.ctaLabel}
                  </Button>
                ) : (
                  <Link to={nextAction.href}>
                    <Button variant="outline" className="w-full">
                      {nextAction.ctaLabel}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 text-xl font-bold text-[#0F1E32]">최종 제출을 진행할까요?</div>
            <p className="text-sm leading-6 text-[#5F6E82]">
              최종 제출 이후에는 운영자가 재오픈하기 전까지 수정이 잠깁니다. 배포 URL, GitHub, PDF 링크를 한 번 더 확인해주세요.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                취소
              </Button>
              <Button onClick={() => void handleFinalize()}>최종 제출</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
