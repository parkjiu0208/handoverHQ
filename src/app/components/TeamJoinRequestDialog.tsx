import { useEffect, useMemo, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { ROLE_OPTIONS } from '../lib/constants';
import { Button } from './Button';
import type { Team, TeamJoinRequestFormInput, UserRole } from '../types/domain';

interface TeamJoinRequestDialogProps {
  open: boolean;
  team: Team | null;
  preferredRole: UserRole | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: TeamJoinRequestFormInput) => Promise<void> | void;
}

export function TeamJoinRequestDialog({
  open,
  team,
  preferredRole,
  submitting = false,
  onClose,
  onSubmit,
}: TeamJoinRequestDialogProps) {
  const initialRole = useMemo<UserRole>(() => {
    if (team?.desiredRoles[0]) {
      return team.desiredRoles[0];
    }

    return preferredRole ?? 'frontend';
  }, [preferredRole, team]);

  const [requestedRole, setRequestedRole] = useState<UserRole>(initialRole);
  const [introMessage, setIntroMessage] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setRequestedRole(initialRole);
    setIntroMessage('');
  }, [initialRole, open]);

  if (!open || !team) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF3F8] px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E32]">팀 참여 요청</h2>
            <p className="mt-2 text-sm text-[#5F6E82]">
              {team.name} 팀장에게 역할과 한 줄 소개를 보내면 검토 후 결과가 반영됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-[#5F6E82] transition-colors hover:bg-[#F6F9FC] hover:text-[#0F1E32]"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-8 py-8">
          <div className="rounded-2xl bg-[#F6F9FC] p-4">
            <div className="text-xs font-black uppercase tracking-wider text-[#5F6E82]">지원 팀</div>
            <div className="mt-2 text-lg font-bold text-[#0F1E32]">{team.name}</div>
            <div className="mt-1 text-sm text-[#5F6E82]">{team.description}</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0F1E32]">맡고 싶은 역할</label>
            <select
              value={requestedRole}
              onChange={(event) => setRequestedRole(event.target.value as UserRole)}
              className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
            >
              {(team.desiredRoles.length > 0 ? ROLE_OPTIONS.filter((role) => team.desiredRoles.includes(role.value)) : ROLE_OPTIONS).map(
                (role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0F1E32]">한 줄 소개</label>
            <textarea
              value={introMessage}
              onChange={(event) => setIntroMessage(event.target.value)}
              placeholder="어떤 역할을 맡을 수 있는지, 지금 바로 기여할 수 있는 내용을 짧게 적어주세요."
              className="min-h-[140px] w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EEF3F8] px-8 py-6">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            onClick={() =>
              void onSubmit({
                teamId: team.id,
                requestedRole,
                introMessage,
              })
            }
            disabled={submitting}
          >
            참여 요청 보내기
          </Button>
        </div>
      </div>
    </div>
  );
}
