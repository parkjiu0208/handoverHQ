import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  CaretDown,
  GridFour,
  MagnifyingGlass,
  MapPin,
  MonitorPlay,
  TextAlignLeft,
  Users,
} from '@phosphor-icons/react';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { formatKoreanDate, getDdayLabel } from '../lib/date';
import { getHackathonStatusLabel } from '../lib/presentation';
import { cn } from '../lib/utils';

type SortMode = 'deadline' | 'latest';
type ViewMode = 'list' | 'grid';

export function Hackathons() {
  const { hackathons, dataLoading } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'active' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('deadline');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const tags = useMemo(
    () => ['all', ...new Set(hackathons.flatMap((hackathon) => hackathon.tags))],
    [hackathons]
  );

  const filteredHackathons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queried = hackathons.filter((hackathon) => {
      const matchesStatus = statusFilter === 'all' || hackathon.status === statusFilter;
      const matchesTag = tagFilter === 'all' || hackathon.tags.includes(tagFilter);
      const matchesSearch =
        query.length === 0 ||
        hackathon.title.toLowerCase().includes(query) ||
        hackathon.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        hackathon.organizer.toLowerCase().includes(query);

      return matchesStatus && matchesTag && matchesSearch;
    });

    return [...queried].sort((left, right) => {
      if (sortMode === 'deadline') {
        return left.submissionDeadline.localeCompare(right.submissionDeadline);
      }

      return right.eventEndAt.localeCompare(left.eventEndAt);
    });
  }, [hackathons, searchQuery, sortMode, statusFilter, tagFilter]);

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen w-full text-[#0F1E32]">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">해커톤 탐색</h1>
            <p className="text-[#5F6E82]">상태, 태그, 마감 순서를 기준으로 대회를 빠르게 비교할 수 있습니다.</p>
          </div>

          <div className="rounded-2xl bg-[#F6F9FC] p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-wrap gap-3">
                <div className="relative w-full lg:w-80">
                  <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6E82]" size={16} />
                  <input
                    type="text"
                    placeholder="대회명, 주최, 기술 스택 검색"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-2xl bg-white py-2.5 pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all placeholder:text-[#5F6E82] focus:ring-4 focus:ring-[#DCEEFF]"
                  />
                </div>

                <div className="flex rounded-2xl bg-white p-1.5 shadow-sm">
                  {[
                    { value: 'all', label: '전체' },
                    { value: 'active', label: '진행 중' },
                    { value: 'upcoming', label: '예정' },
                    { value: 'ended', label: '종료' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setStatusFilter(filter.value as typeof statusFilter)}
                      className={cn(
                        'rounded-xl px-3.5 py-2 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                        statusFilter === filter.value
                          ? 'bg-[#0064FF] text-white shadow-md'
                          : 'text-[#5F6E82] hover:bg-[#F6F9FC] hover:text-[#0F1E32]'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <div ref={sortMenuRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen((open) => !open)}
                    className="inline-flex min-w-fit items-center gap-2 whitespace-nowrap rounded-2xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-bold text-[#0F1E32] shadow-md transition-colors hover:bg-[#F6F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                    aria-expanded={sortMenuOpen}
                  >
                    <span>{sortMode === 'deadline' ? '마감일순' : '최신순'}</span>
                    <CaretDown size={14} className={cn('shrink-0 transition-transform', sortMenuOpen && 'rotate-180')} />
                  </button>

                  {sortMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[150px] rounded-2xl border border-[#D6DEE8] bg-white p-2 shadow-[0_18px_45px_rgba(15,30,50,0.12)]">
                      {[
                        { value: 'deadline' as const, label: '마감일순' },
                        { value: 'latest' as const, label: '최신순' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortMode(option.value);
                            setSortMenuOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                            sortMode === option.value
                              ? 'bg-[#EBF5FF] text-[#0064FF]'
                              : 'text-[#0F1E32] hover:bg-[#F6F9FC]'
                          )}
                        >
                          <span>{option.label}</span>
                          {sortMode === option.value && (
                            <span className="text-[11px] font-bold uppercase tracking-wider">선택됨</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 rounded-2xl bg-white p-1.5 shadow-md">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-xl p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                      viewMode === 'list' ? 'bg-[#0064FF] text-white shadow-sm' : 'text-[#5F6E82]'
                    )}
                  >
                    <TextAlignLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-xl p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                      viewMode === 'grid' ? 'bg-[#0064FF] text-white shadow-sm' : 'text-[#5F6E82]'
                    )}
                  >
                    <GridFour size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tag)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                    tagFilter === tag
                      ? 'border-[#0064FF] bg-[#EBF5FF] text-[#0064FF]'
                      : 'border-[#D6DEE8] bg-white text-[#5F6E82] hover:border-[#0064FF]/40 hover:text-[#0F1E32]'
                  )}
                >
                  {tag === 'all' ? '전체 태그' : tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#EEF3F8] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 text-sm font-bold text-[#5F6E82]">
            총 <span className="text-[#0F1E32]">{filteredHackathons.length}</span>개의 결과
          </div>

          {filteredHackathons.length === 0 ? (
            <EmptyState
              icon={MagnifyingGlass}
              title="검색 결과가 없습니다"
              description="검색어 또는 필터 조건을 조정해 다시 확인해보세요."
              action={{
                label: '초기화',
                onClick: () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTagFilter('all');
                },
              }}
            />
          ) : (
            <div className={viewMode === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'}>
              {filteredHackathons.map((hackathon) => (
                <Link
                  key={hackathon.id}
                  to={`/hackathons/${hackathon.slug}`}
                  className={cn(
                    'group block rounded-2xl bg-white shadow-md transition-shadow hover:shadow-lg',
                    viewMode === 'list' ? 'flex flex-col gap-6 p-6 lg:flex-row lg:items-center' : 'flex flex-col p-6'
                  )}
                >
                  <div className={viewMode === 'list' ? 'flex-1 lg:min-w-[320px]' : 'mb-6'}>
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm',
                          hackathon.status === 'active'
                            ? 'bg-blue-50 text-[#0064FF]'
                            : hackathon.status === 'upcoming'
                              ? 'bg-[#F6F9FC] text-[#0F1E32]'
                              : 'bg-[#F6F9FC] text-[#5F6E82]'
                        )}
                      >
                        {getHackathonStatusLabel(hackathon.status)}
                      </span>
                      <span className="truncate text-xs font-bold text-[#5F6E82]">{hackathon.organizer}</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-[#0F1E32] transition-colors group-hover:text-[#0064FF]">
                      {hackathon.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hackathon.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-lg bg-[#F6F9FC] px-2.5 py-1 text-xs font-bold text-[#0F1E32] shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'flex gap-x-8 gap-y-3 text-sm font-medium text-[#5F6E82]',
                      viewMode === 'list' ? 'flex-1 flex-wrap lg:flex-nowrap lg:justify-end' : 'mt-auto flex-col pt-5'
                    )}
                  >
                    <div className={cn('flex w-full flex-col gap-3', viewMode === 'list' && 'lg:w-auto lg:flex-row lg:gap-8')}>
                      <div className="flex min-w-[120px] items-center gap-2">
                        {hackathon.location.includes('온라인') ? (
                          <MonitorPlay size={16} className="text-[#0064FF]" />
                        ) : (
                          <MapPin size={16} className="text-[#0064FF]" />
                        )}
                        <span>{hackathon.location}</span>
                      </div>
                      <div className="flex min-w-[160px] items-center gap-2">
                        <Calendar size={16} className="text-[#0064FF]" />
                        <span>
                          마감 <span className="font-bold text-[#0F1E32]">{formatKoreanDate(hackathon.submissionDeadline)}</span>
                        </span>
                      </div>
                      <div className="flex min-w-[120px] items-center gap-2">
                        <Users size={16} className="text-[#0064FF]" />
                        <span className="font-bold text-[#0F1E32]">
                          {hackathon.participants}
                          <span className="ml-1 font-medium text-[#5F6E82]">명 참여중</span>
                        </span>
                      </div>
                      <div className="flex min-w-[120px] items-center gap-2">
                        <span className="rounded-full bg-[#EEF3F8] px-2.5 py-1 text-xs font-bold text-[#0F1E32]">
                          {getDdayLabel(hackathon.submissionDeadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
