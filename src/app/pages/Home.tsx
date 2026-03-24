import {
  ArrowRight,
  Calendar,
  Clock,
  MagnifyingGlass,
  Plus,
  Trophy,
  Users,
} from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { ROLE_LABEL_MAP } from '../lib/constants';
import { formatKoreanDate, getDdayLabel } from '../lib/date';
import { getHackathonStatusLabel, getSubmissionStatusLabel } from '../lib/presentation';
import { cn } from '../lib/utils';

export function Home() {
  const {
    currentUser,
    dataLoading,
    getMyTeamForHackathon,
    getSubmissionForHackathon,
    getNextAction,
    hackathons,
    openAuthDialog,
    rankings,
    teams,
  } = useAppContext();

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  const nextAction = getNextAction();
  const activeHackathon =
    [...hackathons]
      .filter((hackathon) => hackathon.status === 'active')
      .sort((left, right) => left.submissionDeadline.localeCompare(right.submissionDeadline))[0] ?? null;
  const myTeam = activeHackathon ? getMyTeamForHackathon(activeHackathon.slug) : null;
  const submission = activeHackathon ? getSubmissionForHackathon(activeHackathon.slug) : null;

  const checklist = [
    { id: 'summary', label: '프로젝트 요약 작성', completed: Boolean(submission?.proposalSummary) },
    { id: 'proposal', label: '기획서 URL 연결', completed: Boolean(submission?.proposalUrl) },
    { id: 'deploy', label: '배포 URL 연결', completed: Boolean(submission?.deployUrl) },
    { id: 'github', label: 'GitHub 저장소 연결', completed: Boolean(submission?.githubUrl) },
    { id: 'pdf', label: '솔루션 PDF 업로드', completed: Boolean(submission?.solutionPdfUrl) },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = myTeam ? Math.round((completedCount / checklist.length) * 100) : 0;

  const activeCount = hackathons.filter((hackathon) => hackathon.status === 'active').length;
  const recruitingCount = teams.filter((team) => team.isRecruiting).length;
  const nearestDeadline = [...hackathons]
    .sort((left, right) => left.submissionDeadline.localeCompare(right.submissionDeadline))
    .find((hackathon) => hackathon.status !== 'ended');

  const featuredHackathons = [...hackathons]
    .filter((hackathon) => hackathon.status !== 'ended')
    .sort((left, right) => left.submissionDeadline.localeCompare(right.submissionDeadline))
    .slice(0, 3);
  const recruitingTeams = [...teams]
    .filter((team) => team.isRecruiting)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 3);
  const topRankings = rankings.slice(0, 3);

  return (
    <div className="min-h-screen w-full text-[#0F1E32]">
      <section className="bg-white px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#0064FF]">Hackathon Operations Hub</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0F1E32] lg:text-5xl">
              명세서만 받아도
              <br />
              구현부터 제출까지
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5F6E82]">
              해커톤 탐색, 팀 빌딩, 제출 검증, 결과 확인까지 한 흐름으로 이어지는 운영 허브입니다. 현재 톤을
              유지하면서도 실제 제출 가능한 구조로 전환하고 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/hackathons">
              <Button variant="outline" className="rounded-2xl shadow-md">
                <MagnifyingGlass size={16} />
                해커톤 보러가기
              </Button>
            </Link>
            <Link to="/camp">
              <Button className="rounded-2xl">
                <Plus size={16} />
                팀 찾기
              </Button>
            </Link>
            <Link to="/rankings">
              <Button variant="secondary" className="rounded-2xl">
                <Trophy size={16} />
                랭킹 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#EEF3F8] px-6 py-12 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-2 text-sm font-medium text-[#5F6E82]">진행 중인 해커톤</div>
            <div className="text-4xl font-bold text-[#0F1E32]">
              {activeCount}
              <span className="ml-2 text-sm font-normal text-[#5F6E82]">건</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="mb-2 text-sm font-medium text-[#5F6E82]">모집 중인 팀</div>
            <div className="text-4xl font-bold text-[#0F1E32]">
              {recruitingCount}
              <span className="ml-2 text-sm font-normal text-[#5F6E82]">팀</span>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-[#05060B] p-6 shadow-md">
            <div className="mb-2 text-sm font-medium text-[#9EA7B5]">가장 가까운 마감</div>
            <div className="text-3xl font-bold text-white">{nearestDeadline ? getDdayLabel(nearestDeadline.submissionDeadline) : '-'}</div>
            <div className="mt-1 text-xs text-[#9EA7B5]">{nearestDeadline?.title ?? '예정된 대회가 없습니다.'}</div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Next Action</h2>
              <span className="text-sm text-[#5F6E82]">지금 해야 할 일</span>
            </div>

            <div className="rounded-2xl bg-[#EBF5FF] p-8 shadow-md">
              <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <Badge variant={currentUser ? 'active' : 'default'}>
                      {currentUser ? (submission ? getSubmissionStatusLabel(submission.status) : myTeam ? '제출 진행 중' : '팀 빌딩 필요') : '로그인 필요'}
                    </Badge>
                    {activeHackathon && (
                      <span className="flex items-center gap-1 text-sm font-semibold text-[#D74A32]">
                        <Clock size={14} />
                        {getDdayLabel(activeHackathon.submissionDeadline)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-[#0F1E32]">{nextAction.title}</h3>
                  <p className="mt-2 max-w-2xl text-[#5F6E82]">{nextAction.description}</p>
                  {myTeam && activeHackathon && (
                    <p className="mt-3 text-sm text-[#5F6E82]">
                      팀: <span className="font-medium text-[#0F1E32]">{myTeam.name}</span> · 대회:{' '}
                      <span className="font-medium text-[#0F1E32]">{activeHackathon.title}</span>
                    </p>
                  )}
                </div>

                {nextAction.href === '#auth' ? (
                  <Button variant="outline" className="rounded-2xl shadow-md" onClick={openAuthDialog}>
                    {nextAction.ctaLabel}
                  </Button>
                ) : (
                  <Link to={nextAction.href}>
                    <Button variant="outline" className="rounded-2xl shadow-md">
                      {nextAction.ctaLabel}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md">
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-[#0F1E32]">제출 진척도</span>
                    <span className="font-bold text-[#0064FF]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#DCEEFF]">
                    <div className="h-2 rounded-full bg-[#0064FF]" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#0F1E32]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#0064FF]" />
                    제출 체크리스트
                  </h4>
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-[#F6F9FC] p-3.5">
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-lg border',
                          item.completed
                            ? 'border-[#0064FF] bg-[#0064FF] text-white'
                            : 'border-[#D6DEE8] bg-white text-transparent'
                        )}
                      >
                        ✓
                      </div>
                      <span className={cn('text-sm font-medium', item.completed ? 'text-[#5F6E82] line-through' : 'text-[#0F1E32]')}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">팀원 모집</h2>
              <Link to="/camp" className="text-sm font-medium text-[#0064FF] transition-colors hover:text-[#0F1E32]">
                더보기
              </Link>
            </div>

            <div className="space-y-4 rounded-2xl bg-[#F6F9FC] p-6 shadow-md">
              {recruitingTeams.map((team) => {
                const hackathon = hackathons.find((item) => item.id === team.hackathonId);
                return (
                  <div key={team.id} className="rounded-2xl bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-1 text-xs text-[#5F6E82]">{hackathon?.title ?? '연결된 해커톤'}</div>
                    <h3 className="text-base font-bold text-[#0F1E32]">{team.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5F6E82]">{team.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.desiredRoles.slice(0, 2).map((role) => (
                        <span key={role} className="rounded-lg bg-[#F6F9FC] px-2 py-1 text-xs font-medium text-[#0F1E32]">
                          {ROLE_LABEL_MAP[role]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#EEF3F8] px-6 py-14 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">주목할 해커톤</h2>
              <Link to="/hackathons" className="flex items-center gap-1 text-sm font-medium text-[#0064FF] transition-colors hover:text-[#0F1E32]">
                전체 목록 <ArrowRight size={16} />
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              {featuredHackathons.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Calendar}
                    title="예정된 해커톤이 없습니다"
                    description="관리자가 새로운 대회를 등록하면 이 영역에 바로 표시됩니다."
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#F6F9FC]">
                  {featuredHackathons.map((hackathon) => (
                    <Link
                      key={hackathon.id}
                      to={`/hackathons/${hackathon.slug}`}
                      className="flex flex-col gap-4 p-6 transition-all hover:bg-[#F6F9FC] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
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
                          <h3 className="text-lg font-bold text-[#0F1E32]">{hackathon.title}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#5F6E82]">
                          <span className="flex items-center gap-1.5">
                            <Users size={14} />
                            {hackathon.organizer}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {formatKoreanDate(hackathon.submissionDeadline)} 마감
                          </span>
                          <span className="font-medium text-[#0F1E32]">{hackathon.teamCount}팀 참여 중</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[#0064FF]">{getDdayLabel(hackathon.submissionDeadline)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Top 랭킹</h2>
              <Link to="/rankings" className="text-sm font-medium text-[#0064FF] transition-colors hover:text-[#0F1E32]">
                전체 순위
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              {topRankings.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Trophy}
                    title="아직 랭킹 데이터가 없습니다"
                    description="최종 제출이 생성되면 팀 포인트와 최근 활동이 이곳에 반영됩니다."
                  />
                </div>
              ) : (
                topRankings.map((entry, index) => (
                  <div
                    key={`${entry.teamId}-${entry.rank}`}
                    className={cn(
                      'flex items-center justify-between p-4 transition-all hover:bg-[#F6F9FC]',
                      index < topRankings.length - 1 && 'border-b border-[#F6F9FC]'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn('w-6 text-center font-bold', entry.rank === 1 ? 'text-[#0064FF]' : 'text-[#5F6E82]')}>
                        {entry.rank}
                      </span>
                      <div>
                        <div className="font-bold text-[#0F1E32]">{entry.teamName}</div>
                        <div className="text-xs text-[#5F6E82]">
                          우승 {entry.wins}회 · 제출 {entry.submissions}회
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[#5F6E82]">{entry.points.toLocaleString()} pt</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
