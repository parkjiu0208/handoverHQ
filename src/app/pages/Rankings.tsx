import { useMemo, useState } from 'react';
import { ArrowSquareOut, Info, TrendUp, Trophy } from '@phosphor-icons/react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { PERIOD_OPTIONS } from '../lib/constants';
import { formatKoreanDate, isWithinPeriod } from '../lib/date';
import { cn } from '../lib/utils';
import type { LeaderboardEntry, RankingPeriod } from '../types/domain';

interface RankingCardView {
  rank: number;
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  submissions: number;
  lastActive: string;
  trend: 'up' | 'down' | 'same';
  projectUrl: string;
  bestRank: number;
}

const PODIUM_STYLES: Record<
  1 | 2 | 3,
  {
    slot: string;
    card: string;
    badge: string;
    badgeText: string;
    chip: string;
  }
> = {
  1: {
    slot: 'col-start-2 md:-translate-y-3',
    card:
      'min-h-[260px] border-[#B9D4FF] bg-[linear-gradient(180deg,#C9DDFF_0%,#E8F1FF_58%,#F8FBFF_100%)] shadow-[0_28px_60px_rgba(0,100,255,0.22)]',
    badge: 'bg-[#FFC83D] text-[#5A3A00]',
    badgeText: '현재 선두',
    chip: 'bg-[#FF8F0A] text-white',
  },
  2: {
    slot: 'col-start-1 md:translate-y-8',
    card:
      'min-h-[224px] border-[#D5D9E1] bg-[linear-gradient(180deg,#D9DDE5_0%,#EEF1F5_58%,#FFFFFF_100%)] shadow-[0_22px_44px_rgba(15,30,50,0.14)]',
    badge: 'bg-[#636B78] text-white',
    badgeText: '가장 가까운 추격',
    chip: 'bg-[#6B7280] text-white',
  },
  3: {
    slot: 'col-start-3 md:translate-y-8',
    card:
      'min-h-[224px] border-[#FFD0DD] bg-[linear-gradient(180deg,#FFC6DA_0%,#FFE5EE_58%,#FFF7FA_100%)] shadow-[0_22px_44px_rgba(255,120,146,0.16)]',
    badge: 'bg-[#9B6A44] text-white',
    badgeText: '상위권 유지',
    chip: 'bg-[#A46A31] text-white',
  },
};

const AVATAR_STYLES = [
  'bg-[linear-gradient(135deg,#EDF5FF_0%,#BFD7FF_100%)] text-[#13408F]',
  'bg-[linear-gradient(135deg,#FFF1E0_0%,#FFD39F_100%)] text-[#7A4100]',
  'bg-[linear-gradient(135deg,#F6EAFF_0%,#D9C3FF_100%)] text-[#5B2D9D]',
  'bg-[linear-gradient(135deg,#E7FFF7_0%,#9EEACF_100%)] text-[#0D6F5A]',
  'bg-[linear-gradient(135deg,#FFF0F5_0%,#FFC7D8_100%)] text-[#9C2E56]',
];

function hashString(value: string) {
  return [...value].reduce((accumulator, current) => accumulator + current.charCodeAt(0), 0);
}

function getAvatarStyle(seed: string) {
  return AVATAR_STYLES[hashString(seed) % AVATAR_STYLES.length];
}

function getTeamMonogram(teamName: string) {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }

  return teamName.replace(/\s+/g, '').slice(0, 2).toUpperCase();
}

function buildLeaderboardView(entries: LeaderboardEntry[], period: RankingPeriod): RankingCardView[] {
  const aggregated = new Map<string, Omit<RankingCardView, 'rank' | 'trend'>>();

  entries
    .filter((entry) => isWithinPeriod(entry.submittedAt, period))
    .forEach((entry) => {
      const current = aggregated.get(entry.teamId);

      if (!current) {
        aggregated.set(entry.teamId, {
          teamId: entry.teamId,
          teamName: entry.teamName,
          points: Math.round(entry.totalScore * 10),
          wins: entry.rank === 1 ? 1 : 0,
          submissions: 1,
          lastActive: entry.submittedAt,
          projectUrl: entry.projectUrl,
          bestRank: entry.rank,
        });
        return;
      }

      aggregated.set(entry.teamId, {
        ...current,
        points: current.points + Math.round(entry.totalScore * 10),
        wins: current.wins + (entry.rank === 1 ? 1 : 0),
        submissions: current.submissions + 1,
        lastActive: current.lastActive > entry.submittedAt ? current.lastActive : entry.submittedAt,
        projectUrl: entry.projectUrl || current.projectUrl,
        bestRank: Math.min(current.bestRank, entry.rank),
      });
    });

  return [...aggregated.values()]
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      if (right.wins !== left.wins) return right.wins - left.wins;
      if (right.lastActive !== left.lastActive) return right.lastActive.localeCompare(left.lastActive);
      return left.teamId.localeCompare(right.teamId);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      trend: entry.bestRank === 1 ? 'up' : entry.bestRank <= 3 ? 'same' : 'down',
    }));
}

function getTrendLabel(trend: RankingCardView['trend']) {
  if (trend === 'up') return '상승세';
  if (trend === 'down') return '추격 필요';
  return '안정적';
}

function getTrendStyle(trend: RankingCardView['trend']) {
  if (trend === 'up') return 'text-[#65D0FF] bg-[#0C203A]';
  if (trend === 'down') return 'text-[#FF8D99] bg-[#28141A]';
  return 'text-[#BFC9D8] bg-white/[0.08]';
}

export function Rankings() {
  const { dataLoading, leaderboardEntries } = useAppContext();
  const [period, setPeriod] = useState<RankingPeriod>('all');

  const aggregatedRankings = useMemo(
    () => buildLeaderboardView(leaderboardEntries, period),
    [leaderboardEntries, period]
  );

  const latestActivity = aggregatedRankings[0]?.lastActive ?? null;
  const topTeam = aggregatedRankings[0] ?? null;
  const podiumTeams = useMemo(
    () => new Map(aggregatedRankings.slice(0, 3).map((team) => [team.rank, team])),
    [aggregatedRankings]
  );

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[#07111F] text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_top,_rgba(0,100,255,0.28),_transparent_56%)]" />
        <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-[#00A3FF]/10 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-[#4B5DFF]/12 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#7DB6FF]">Leaderboard Live</p>
              <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">실시간 팀 리더보드</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#AAB5C5] lg:text-base">
                상위 팀은 포디움으로 강조하고, 전체 순위는 아래에서 한눈에 훑을 수 있게 정리했습니다.
                같은 점수일 때는 우승 횟수와 최근 제출 시점까지 함께 반영합니다.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur">
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={period === option.value}
                    onClick={() => setPeriod(option.value)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-bold transition-all',
                      period === option.value
                        ? 'bg-white text-[#07111F] shadow-[0_12px_30px_rgba(255,255,255,0.22)]'
                        : 'text-[#AAB5C5] hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {aggregatedRankings.length === 0 ? (
            <div className="mt-10 rounded-[32px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-14 text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
              <div className="text-2xl font-black text-white">표시할 랭킹 데이터가 없습니다</div>
              <p className="mt-3 text-sm text-[#AAB5C5]">선택한 기간에 해당하는 제출 데이터가 아직 집계되지 않았습니다.</p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">현재 1위</div>
                  <div className="mt-3 text-2xl font-black text-white">{topTeam?.teamName ?? '-'}</div>
                  <div className="mt-2 text-sm text-[#AAB5C5]">
                    {topTeam ? `${topTeam.points.toLocaleString()}pt · 우승 ${topTeam.wins}회` : '집계 중'}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">집계 팀 수</div>
                  <div className="mt-3 text-2xl font-black text-white">{aggregatedRankings.length}팀</div>
                  <div className="mt-2 text-sm text-[#AAB5C5]">선택한 기간 기준으로 점수가 있는 팀만 표시합니다.</div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">최근 업데이트</div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {latestActivity ? formatKoreanDate(latestActivity) : '-'}
                  </div>
                  <div className="mt-2 text-sm text-[#AAB5C5]">제출 반영 시점이 가장 최근인 팀 활동을 기준으로 보여줍니다.</div>
                </div>
              </div>

              <section className="mt-8 rounded-[36px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">Top 3 Spotlight</div>
                    <h2 className="mt-2 text-2xl font-black text-white">포디움</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-[#AAB5C5]">
                    상위 3개 팀
                  </div>
                </div>

                <div className="grid grid-cols-3 items-end gap-3 md:gap-5">
                  {[1, 2, 3].map((rank) => {
                    const team = podiumTeams.get(rank);
                    const style = PODIUM_STYLES[rank as 1 | 2 | 3];

                    if (!team) {
                      return (
                        <div
                          key={rank}
                          className={cn(
                            'relative rounded-[28px] border border-dashed border-white/12 bg-white/[0.02] p-4 text-center text-[#8391A5]',
                            style.slot,
                            rank === 1 ? 'min-h-[260px]' : 'min-h-[224px]'
                          )}
                        >
                          <div className="pt-10 text-sm font-bold">아직 집계 전</div>
                        </div>
                      );
                    }

                    return (
                      <article
                        key={team.teamId}
                        className={cn(
                          'relative overflow-hidden rounded-[28px] border p-4 text-[#0F1E32] md:p-6',
                          style.slot,
                          style.card
                        )}
                        aria-label={`${team.rank}위 팀 ${team.teamName}`}
                      >
                        <div
                          className={cn(
                            'absolute left-1/2 top-0 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black shadow-lg',
                            style.badge
                          )}
                        >
                          <Trophy size={12} weight="fill" />
                          {team.rank}위
                        </div>

                        <div className="mt-4 flex min-h-full flex-col justify-between gap-5">
                          <div className="text-center">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-black/55">{style.badgeText}</div>
                            <div className="mt-4 flex justify-center">
                              <div
                                className={cn(
                                  'flex h-20 w-20 items-center justify-center rounded-[28px] border border-black/5 text-2xl font-black shadow-[0_18px_40px_rgba(0,0,0,0.14)] md:h-24 md:w-24 md:text-3xl',
                                  getAvatarStyle(team.teamId)
                                )}
                              >
                                {getTeamMonogram(team.teamName)}
                              </div>
                            </div>
                          </div>

                          <div className="text-center">
                            <h3 className="line-clamp-2 text-lg font-black tracking-tight text-[#0F1E32] md:text-[1.75rem]">
                              {team.teamName}
                            </h3>
                            <div className="mt-3 text-[1.8rem] font-black tracking-tight text-[#FF6B7A] md:text-[2.5rem]">
                              +{team.points.toLocaleString()}
                              <span className="ml-1 text-sm font-bold text-[#0F1E32]/60">pt</span>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#0F1E32]/60">
                              <span>우승 {team.wins}회</span>
                              <span className="h-1 w-1 rounded-full bg-[#0F1E32]/30" />
                              <span>제출 {team.submissions}회</span>
                            </div>
                          </div>

                          <div className="flex justify-center">
                            <span className={cn('rounded-full px-4 py-1.5 text-xs font-black', style.chip)}>
                              최근 제출 {formatKoreanDate(team.lastActive)}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-4">
                  <div className="mb-4 flex items-center justify-between gap-4 px-2 py-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">All Rankings</div>
                      <h2 className="mt-2 text-2xl font-black text-white">전체 순위</h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-[#AAB5C5]">
                      총 {aggregatedRankings.length}팀
                    </div>
                  </div>

                  <ol className="space-y-3">
                    {aggregatedRankings.map((team) => (
                      <li
                        key={team.teamId}
                        className={cn(
                          'rounded-[28px] border px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-colors md:px-5',
                          team.rank <= 3
                            ? 'border-white/12 bg-white/[0.08]'
                            : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-14 min-w-[3.75rem] flex-col items-center justify-center rounded-[20px] text-sm font-black',
                                team.rank === 1 && 'bg-[#FFC83D] text-[#5A3A00]',
                                team.rank === 2 && 'bg-[#D9DDE5] text-[#34404F]',
                                team.rank === 3 && 'bg-[#F0C4AE] text-[#5A3424]',
                                team.rank > 3 && 'bg-white/[0.06] text-white'
                              )}
                            >
                              <span className="text-lg leading-none">{team.rank}</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">rank</span>
                            </div>

                            <div
                              className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-[20px] text-base font-black shadow-[0_12px_28px_rgba(0,0,0,0.18)]',
                                getAvatarStyle(team.teamId)
                              )}
                            >
                              {getTeamMonogram(team.teamName)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-black tracking-tight text-white">{team.teamName}</h3>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
                                    getTrendStyle(team.trend)
                                  )}
                                >
                                  {team.trend !== 'same' && (
                                    <TrendUp
                                      size={12}
                                      className={cn(team.trend === 'down' && 'rotate-180')}
                                      aria-hidden="true"
                                    />
                                  )}
                                  {getTrendLabel(team.trend)}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#AAB5C5]">
                                <span>우승 {team.wins}회</span>
                                <span className="h-1 w-1 rounded-full bg-white/25" />
                                <span>제출 {team.submissions}회</span>
                                <span className="h-1 w-1 rounded-full bg-white/25" />
                                <span>최근 {formatKoreanDate(team.lastActive)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                            <div className="text-right">
                              <div className="text-[1.75rem] font-black tracking-tight text-[#FF7A82] md:text-[2.2rem]">
                                +{team.points.toLocaleString()}
                              </div>
                              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#AAB5C5]">points</div>
                            </div>

                            {team.projectUrl ? (
                              <a
                                href={team.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${team.teamName} 프로젝트 보기`}
                                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/[0.10]"
                              >
                                프로젝트 보기
                                <ArrowSquareOut size={14} />
                              </a>
                            ) : (
                              <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-bold text-[#7F8A9A]">
                                링크 준비 중
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <aside className="space-y-4">
                  <div className="rounded-[32px] border border-white/10 bg-[#0D1728] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
                    <div className="mb-4 flex items-center gap-2">
                      <Info size={18} className="text-[#7DB6FF]" />
                      <div className="text-lg font-black text-white">점수 읽는 법</div>
                    </div>
                    <div className="space-y-3 text-sm text-[#AAB5C5]">
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">Score</div>
                        <p className="mt-2 leading-6">제출 총점을 10배수로 환산해 누적 포인트로 표시합니다.</p>
                      </div>
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">Tie Break</div>
                        <p className="mt-2 leading-6">동점일 때는 우승 횟수, 최근 제출 시점, 팀 ID 순으로 정렬합니다.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.24)] backdrop-blur">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#7DB6FF]">Quick Insight</div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="text-sm font-bold text-[#AAB5C5]">가장 뜨거운 팀</div>
                        <div className="mt-1 text-xl font-black text-white">
                          {aggregatedRankings.find((entry) => entry.trend === 'up')?.teamName ?? '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#AAB5C5]">평균 포인트</div>
                        <div className="mt-1 text-xl font-black text-white">
                          {Math.round(
                            aggregatedRankings.reduce((accumulator, team) => accumulator + team.points, 0) /
                              aggregatedRankings.length
                          ).toLocaleString()}
                          <span className="ml-1 text-sm font-bold text-[#AAB5C5]">pt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
