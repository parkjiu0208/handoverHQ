import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';
import { ROLE_OPTIONS } from '../lib/constants';
import { useAppContext } from '../hooks/useAppContext';
import type { UserRole } from '../types/domain';

export function AuthDialog() {
  const {
    authDialogOpen,
    closeAuthDialog,
    requestAuth,
    signInWithGitHub,
    isSupabaseReady,
    preferredRole,
  } = useAppContext();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [primaryRole, setPrimaryRole] = useState<UserRole | null>(preferredRole);

  if (!authDialogOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060B]/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF3F8] px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E32]">계속하려면 로그인</h2>
            <p className="mt-1 text-sm text-[#5F6E82]">
              {isSupabaseReady
                ? '이메일 매직링크 또는 GitHub 로그인으로 이어서 작업합니다.'
                : '현재는 데모 모드입니다. 입력값은 브라우저에만 저장됩니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthDialog}
            className="rounded-2xl p-2 text-[#5F6E82] transition-colors hover:bg-[#F6F9FC] hover:text-[#0F1E32]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-8 py-8">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#0F1E32]">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="team@handoverhq.dev"
              className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm text-[#0F1E32] outline-none transition-colors focus:border-[#0064FF]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#0F1E32]">이름</label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="김프론트"
              className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm text-[#0F1E32] outline-none transition-colors focus:border-[#0064FF]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#0F1E32]">관심 역할</label>
            <select
              value={primaryRole ?? ''}
              onChange={(event) => setPrimaryRole((event.target.value as UserRole) || null)}
              className="w-full rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm text-[#0F1E32] outline-none transition-colors focus:border-[#0064FF]"
            >
              <option value="">선택 안 함</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-[#EEF3F8] p-4 text-sm text-[#5F6E82]">
            팀 생성, 제출 저장, Team Fit 계산은 로그인 상태에서만 활성화됩니다.
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => requestAuth({ email, displayName, primaryRole })}
            >
              {isSupabaseReady ? '이메일 매직링크 받기' : '데모 로그인'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={signInWithGitHub}
            >
              GitHub로 로그인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
