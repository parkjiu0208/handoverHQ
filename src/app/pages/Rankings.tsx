import { useState } from 'react';
import { ArrowSquareOut, Info, TrendUp, Trophy } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { PERIOD_OPTIONS } from '../lib/constants';
import { formatKoreanDate, isWithinPeriod } from '../lib/date';
import type { RankingPeriod } from '../types/domain';

export function Rankings() {
  const { dataLoading, leaderboardEntries } = useAppContext();
  const [period, setPeriod] = useState<RankingPeriod>('all');

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  const filteredEntries = leaderboardEntries.filter((entry) => isWithinPeriod(entry.submittedAt, period));
  const aggregatedRankings = Object.values(
    filteredEntries.reduce<
      Record<
        string,
        {
          teamName: string;
          points: number;
          hackathonsWon: number;
          hackathonsParticipated: number;
          lastActive: string;
          trend: 'up' | 'down' | 'same';
          projectUrl: string;
        }
      >
    >((accumulator, entry) => {
      const current = accumulator[entry.teamId];

      if (!current) {
        accumulator[entry.teamId] = {
          teamName: entry.teamName,
          points: Math.round(entry.totalScore * 10),
          hackathonsWon: entry.rank === 1 ? 1 : 0,
          hackathonsParticipated: 1,
          lastActive: entry.submittedAt,
          trend: entry.rank === 1 ? 'up' : entry.rank >= 3 ? 'down' : 'same',
          projectUrl: entry.projectUrl,
        };
        return accumulator;
      }

      current.points += Math.round(entry.totalScore * 10);
      current.hackathonsParticipated += 1;
      current.hackathonsWon += entry.rank === 1 ? 1 : 0;
      current.lastActive = current.lastActive > entry.submittedAt ? current.lastActive : entry.submittedAt;
      current.projectUrl = entry.projectUrl || current.projectUrl;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right.points - left.points)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

  return (
    <div className="min-h-screen w-full text-[#0F1E32]">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
          <div className="mb-6">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">팀 랭킹</h1>
            <p className="text-[#5F6E82]">제출 점수와 활동 이력을 바탕으로 전체 팀 순위를 정렬합니다.</p>
          </div>
          <div className="rounded-2xl bg-[#F6F9FC] p-6 shadow-sm">
            <div className="flex w-fit gap-1 rounded-2xl bg-white p-1.5 shadow-md">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-xl px-5 py-2 text-sm font-bold transition-colors ${
                    period === option.value
                      ? 'bg-[#0064FF] text-white'
                      : 'text-[#5F6E82] hover:bg-[#F6F9FC] hover:text-[#0F1E32]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#EEF3F8] px-6 py-14">
        <div className="mx-auto max-w-6xl">
          {aggregatedRankings.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="표시할 랭킹 데이터가 없습니다"
              description="선택한 기간에 해당하는 제출 데이터가 없습니다."
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-3">
                {aggregatedRankings.slice(0, 3).map((team, index) => (
                  <div
                    key={team.teamName}
                    className={`relative rounded-2xl bg-white p-8 text-center shadow-lg ${index === 0 ? 'ring-2 ring-[#0064FF]' : ''}`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0064FF] px-4 py-1 text-xs font-bold text-white shadow-md">
                        <Trophy size={12} /> 1위
                      </div>
                    )}
                    <div
                      className={`mb-4 text-6xl font-black tracking-tighter ${
                        index === 0 ? 'text-[#0064FF]' : index === 1 ? 'text-[#0F1E32]' : 'text-[#5F6E82]'
                      }`}
                    >
                      {team.rank}
                    </div>
                    <h3 className="mb-1 text-xl font-bold text-[#0F1E32]">{team.teamName}</h3>
                    <div className="mb-8 text-4xl font-bold text-[#0F1E32]">
                      {team.points.toLocaleString()}
                      <span className="ml-1 text-sm font-medium text-[#5F6E82]">pt</span>
                    </div>
                    <div className="flex items-center justify-center gap-8 border-t border-[#F6F9FC] pt-6 text-sm">
                      <div>
                        <div className="mb-1 text-xs font-medium text-[#5F6E82]">우승</div>
                        <div className="text-lg font-bold text-[#0F1E32]">{team.hackathonsWon}회</div>
                      </div>
                      <div className="h-10 w-px bg-[#F6F9FC]" />
                      <div>
                        <div className="mb-1 text-xs font-medium text-[#5F6E82]">참가</div>
                        <div className="text-lg font-bold text-[#0F1E32]">{team.hackathonsParticipated}회</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-10 lg:flex-row">
                <div className="flex-1 overflow-hidden rounded-2xl bg-white shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F6F9FC] text-[#5F6E82]">
                        <tr>
                          <th className="w-20 px-6 py-4 text-center font-bold">순위</th>
                          <th className="px-6 py-4 font-bold">팀명</th>
                          <th className="px-6 py-4 text-right font-bold">포인트</th>
                          <th className="px-6 py-4 text-center font-bold">우승 / 참가</th>
                          <th className="px-6 py-4 text-center font-bold">승률</th>
                          <th className="px-6 py-4 text-right font-bold">최근 활동</th>
                          <th className="px-6 py-4 text-right font-bold">프로젝트</th>
                          <th className="w-20 px-6 py-4 text-center font-bold">추세</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F9FC]">
                        {aggregatedRankings.map((team) => (
                          <tr key={team.teamName} className="transition-colors hover:bg-[#F6F9FC]">
                            <td className="px-6 py-4 text-center text-lg font-bold text-[#5F6E82]">{team.rank}</td>
                            <td className="px-6 py-4 font-bold text-[#0F1E32]">{team.teamName}</td>
                            <td className="px-6 py-4 text-right font-bold text-[#0064FF]">{team.points.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center font-medium text-[#0F1E32]">
                              {team.hackathonsWon} / {team.hackathonsParticipated}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="rounded-lg bg-[#F6F9FC] px-2.5 py-1 text-xs font-bold text-[#0F1E32]">
                                {Math.round((team.hackathonsWon / team.hackathonsParticipated) * 100)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-xs font-medium text-[#5F6E82]">{formatKoreanDate(team.lastActive)}</td>
                            <td className="px-6 py-4 text-right">
                              {team.projectUrl ? (
                                <a
                                  href={team.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm font-bold text-[#0064FF]"
                                >
                                  보기
                                  <ArrowSquareOut size={14} />
                                </a>
                              ) : (
                                <span className="text-xs text-[#5F6E82]">없음</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center">
                                {team.trend === 'up' ? (
                                  <TrendUp size={16} className="text-[#0064FF]" />
                                ) : team.trend === 'down' ? (
                                  <TrendUp size={16} className="rotate-180 text-[#D74A32]" />
                                ) : (
                                  <div className="h-[2px] w-4 bg-[#D6DEE8]" />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-[#F6F9FC] p-4 text-center">
                    <Button variant="outline" className="rounded-2xl">더 많은 팀 보기</Button>
                  </div>
                </div>

                <div className="w-full space-y-5 lg:w-72">
                  <div className="rounded-2xl bg-[#05060B] p-6 text-white shadow-lg">
                    <div className="mb-4 flex items-center gap-2">
                      <Info size={20} className="text-[#0064FF]" />
                      <div className="text-lg font-bold">포인트 산정 기준</div>
                    </div>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: '해커톤 참가', point: '+100pt' },
                        { label: '랭킹 점수 반영', point: '총점 x 10' },
                        { label: '1위 보정', point: '+50pt' },
                        { label: '기한 내 제출', point: '기본 포함' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between border-b border-white/10 pb-3 last:border-none last:pb-0">
                          <span className="text-white/70">{item.label}</span>
                          <span className="font-bold text-[#0064FF]">{item.point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-6 shadow-md">
                    <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#5F6E82]">주간 인사이트</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="mb-2 text-xs font-medium text-[#5F6E82]">가장 빠른 성장</div>
                        <div className="flex items-center gap-2 text-lg font-bold text-[#0F1E32]">
                          {aggregatedRankings.find((entry) => entry.trend === 'up')?.teamName ?? '-'}
                          <span className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-[10px] font-bold text-[#0064FF]">HOT</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-medium text-[#5F6E82]">최근 활동 팀</div>
                        <div className="text-3xl font-bold text-[#0F1E32]">
                          {aggregatedRankings.length}
                          <span className="ml-1 text-sm font-normal text-[#5F6E82]">팀</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
