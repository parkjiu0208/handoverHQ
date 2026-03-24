import { useEffect, useState } from 'react';
import { ArrowSquareOut, MagnifyingGlass, PencilSimple, Plus, Users, X } from '@phosphor-icons/react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAppContext } from '../hooks/useAppContext';
import { ROLE_OPTIONS } from '../lib/constants';
import { formatDateTime } from '../lib/date';
import { getMyTeams, getTeamFitLevel } from '../lib/presentation';
import { openExternalUrl } from '../lib/url';
import type { Team, TeamFormInput, UserRole } from '../types/domain';

const defaultFormState: TeamFormInput = {
  hackathonId: '',
  name: '',
  description: '',
  currentSize: 1,
  maxSize: 4,
  isRecruiting: true,
  desiredRoles: [],
  techTags: [],
  contactUrl: '',
};

export function Camp() {
  const {
    currentUser,
    preferredRole,
    dataLoading,
    hackathons,
    teams,
    saveTeam,
    openAuthDialog,
  } = useAppContext();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [recruitingOnly, setRecruitingOnly] = useState(true);
  const [selectedHackathon, setSelectedHackathon] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [techTagsInput, setTechTagsInput] = useState('');
  const [formState, setFormState] = useState<TeamFormInput>(defaultFormState);

  useEffect(() => {
    if (!editingTeam) {
      setFormState(defaultFormState);
      setTechTagsInput('');
      return;
    }

    setFormState({
      id: editingTeam.id,
      hackathonId: editingTeam.hackathonId,
      name: editingTeam.name,
      description: editingTeam.description,
      currentSize: editingTeam.currentSize,
      maxSize: editingTeam.maxSize,
      isRecruiting: editingTeam.isRecruiting,
      desiredRoles: editingTeam.desiredRoles,
      techTags: editingTeam.techTags,
      contactUrl: editingTeam.contactUrl,
    });
    setTechTagsInput(editingTeam.techTags.join(', '));
  }, [editingTeam]);

  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  const filteredTeams = teams.filter((team) => {
    const matchesRecruiting = !recruitingOnly || team.isRecruiting;
    const matchesHackathon = selectedHackathon === 'all' || team.hackathonId === selectedHackathon;
    const matchesRole = selectedRole === 'all' || team.desiredRoles.includes(selectedRole as UserRole);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      team.name.toLowerCase().includes(query) ||
      team.description.toLowerCase().includes(query) ||
      team.techTags.some((tag) => tag.toLowerCase().includes(query));
    return matchesRecruiting && matchesHackathon && matchesRole && matchesSearch;
  });

  const myTeams = getMyTeams(teams, currentUser);

  function openCreateForm() {
    if (!currentUser) {
      openAuthDialog();
      return;
    }
    setEditingTeam(null);
    setShowCreateForm(true);
  }

  function startEdit(team: Team) {
    setEditingTeam(team);
    setShowCreateForm(true);
  }

  async function handleSave() {
    await saveTeam({
      ...formState,
      techTags: techTagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setShowCreateForm(false);
    setEditingTeam(null);
  }

  return (
    <div className="min-h-screen w-full text-[#0F1E32]">
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight">팀 모집</h1>
              <p className="text-[#5F6E82]">필요한 역할과 해커톤 기준으로 팀을 비교하고, 바로 팀을 만들거나 수정할 수 있습니다.</p>
            </div>
            <Button className="rounded-2xl" onClick={openCreateForm}>
              <Plus size={16} />
              새 팀 만들기
            </Button>
          </div>

          <div className="rounded-2xl bg-[#F6F9FC] p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1 lg:max-w-md">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6E82]" size={16} />
                <input
                  type="text"
                  placeholder="팀명, 기술 스택, 설명 검색"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-colors focus:ring-2 focus:ring-[#0064FF]"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedHackathon}
                  onChange={(event) => setSelectedHackathon(event.target.value)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm outline-none"
                >
                  <option value="all">모든 해커톤</option>
                  {hackathons.map((hackathon) => (
                    <option key={hackathon.id} value={hackathon.id}>
                      {hackathon.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm outline-none"
                >
                  <option value="all">모든 역할</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <input
                    type="checkbox"
                    checked={recruitingOnly}
                    onChange={(event) => setRecruitingOnly(event.target.checked)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-bold text-[#0F1E32]">모집 중만</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#EEF3F8] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {myTeams.length > 0 && (
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 text-sm font-bold uppercase tracking-wider text-[#5F6E82]">내 팀</div>
              <div className="grid gap-4 md:grid-cols-2">
                {myTeams.map((team) => (
                  <div key={team.id} className="rounded-2xl bg-[#F6F9FC] p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-lg font-bold text-[#0F1E32]">{team.name}</div>
                      <Button variant="outline" size="sm" onClick={() => startEdit(team)}>
                        <PencilSimple size={14} />
                        수정
                      </Button>
                    </div>
                    <div className="text-sm text-[#5F6E82]">
                      {hackathons.find((hackathon) => hackathon.id === team.hackathonId)?.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 text-sm font-medium text-[#5F6E82]">
            총 <span className="font-bold text-[#0F1E32]">{filteredTeams.length}</span>개의 모집글
          </div>

          {filteredTeams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="모집글이 없습니다"
              description="조건에 맞는 팀이 없습니다. 직접 모집글을 만들어보세요."
              action={{ label: '새 팀 만들기', onClick: openCreateForm }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => {
                const fit = getTeamFitLevel(preferredRole, team);
                const linkedHackathon = hackathons.find((hackathon) => hackathon.id === team.hackathonId);

                return (
                  <div key={team.id} className="group flex flex-col rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-xl">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex max-w-[220px] truncate rounded-lg bg-[#F6F9FC] px-2.5 py-1 text-xs font-bold text-[#5F6E82]">
                          {linkedHackathon?.title ?? '연결 대회 없음'}
                        </div>
                        <h3 className="text-xl font-bold text-[#0F1E32] transition-colors group-hover:text-[#0064FF]">{team.name}</h3>
                      </div>
                      <Badge variant={team.isRecruiting ? 'recruiting' : 'ended'}>
                        {team.isRecruiting ? '모집중' : '마감'}
                      </Badge>
                    </div>

                    <p className="min-h-[72px] text-sm leading-relaxed text-[#5F6E82]">{team.description}</p>

                    <div className="mt-5 rounded-2xl bg-[#F6F9FC] p-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5F6E82]">Team Fit</div>
                      <div
                        className={`text-sm font-bold ${
                          fit.tone === 'high'
                            ? 'text-[#0064FF]'
                            : fit.tone === 'medium'
                              ? 'text-[#0F1E32]'
                              : 'text-[#5F6E82]'
                        }`}
                      >
                        {fit.label}
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      <div className="flex items-center gap-4 border-t border-[#F6F9FC] pt-4 text-sm font-bold text-[#0F1E32]">
                        <div className="flex items-center gap-2">
                          <Users size={15} className="text-[#5F6E82]" />
                          <span>{team.currentSize} / {team.maxSize}명</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#5F6E82]">필요 역할</div>
                        <div className="flex flex-wrap gap-2">
                          {team.desiredRoles.length > 0 ? team.desiredRoles.map((role) => (
                            <span key={role} className="rounded-lg bg-[#F6F9FC] px-2.5 py-1 text-xs font-medium text-[#0F1E32]">
                              {ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role}
                            </span>
                          )) : <span className="text-xs text-[#5F6E82]">추가 모집 없음</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#5F6E82]">기술 태그</div>
                        <div className="flex flex-wrap gap-2">
                          {team.techTags.map((tag) => (
                            <span key={tag} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#0F1E32]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#F6F9FC] pt-4">
                        <div className="text-xs font-medium text-[#5F6E82]">{formatDateTime(team.updatedAt)} 업데이트</div>
                        <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => openExternalUrl(team.contactUrl)}>
                          <ArrowSquareOut size={14} />
                          연락하기
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EEF3F8] px-8 py-6">
              <h2 className="text-xl font-bold text-[#0F1E32]">
                {editingTeam ? '팀 모집글 수정' : '새 팀 모집글 작성'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTeam(null);
                }}
                className="rounded-2xl p-2 text-[#5F6E82] transition-colors hover:bg-[#F6F9FC] hover:text-[#0F1E32]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#0F1E32]">참여 해커톤</label>
                <select
                  value={formState.hackathonId}
                  onChange={(event) => setFormState((current) => ({ ...current, hackathonId: event.target.value }))}
                  className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                >
                  <option value="">해커톤을 선택해주세요</option>
                  {hackathons.map((hackathon) => (
                    <option key={hackathon.id} value={hackathon.id}>
                      {hackathon.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0F1E32]">팀 이름</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0F1E32]">모집 내용</label>
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[140px] w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#0F1E32]">현재 인원</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formState.currentSize}
                    onChange={(event) => setFormState((current) => ({ ...current, currentSize: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#0F1E32]">최대 인원</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={formState.maxSize}
                    onChange={(event) => setFormState((current) => ({ ...current, maxSize: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-[#0F1E32]">모집 직군</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const checked = formState.desiredRoles.includes(role.value);
                    return (
                      <label
                        key={role.value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-3.5 py-2 shadow-sm transition-colors ${
                          checked ? 'bg-blue-50 text-[#0064FF]' : 'bg-white text-[#0F1E32]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              desiredRoles: event.target.checked
                                ? [...current.desiredRoles, role.value]
                                : current.desiredRoles.filter((value) => value !== role.value),
                            }))
                          }
                          className="h-3.5 w-3.5 rounded"
                        />
                        <span className="text-sm font-medium">{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0F1E32]">기술 태그</label>
                <input
                  type="text"
                  value={techTagsInput}
                  onChange={(event) => setTechTagsInput(event.target.value)}
                  placeholder="React, Supabase, AI/ML"
                  className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#0F1E32]">연락 링크</label>
                <input
                  type="url"
                  value={formState.contactUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, contactUrl: event.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <label className="flex items-center gap-2 rounded-2xl bg-[#F6F9FC] px-4 py-3">
                <input
                  type="checkbox"
                  checked={formState.isRecruiting}
                  onChange={(event) => setFormState((current) => ({ ...current, isRecruiting: event.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-bold text-[#0F1E32]">모집 중으로 공개</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#EEF3F8] px-8 py-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTeam(null);
                }}
              >
                취소
              </Button>
              <Button onClick={() => void handleSave()}>
                {editingTeam ? '수정 저장' : '팀 등록'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
