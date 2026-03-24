import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { List, SignOut, Sparkle, UserCircle, X } from '@phosphor-icons/react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useAppContext } from '../hooks/useAppContext';
import { ROLE_LABEL_MAP } from '../lib/constants';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/hackathons', label: '해커톤 탐색' },
  { path: '/camp', label: '팀 모집' },
  { path: '/rankings', label: '랭킹' },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, isSupabaseReady, openAuthDialog, signOut } = useAppContext();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const roleLabel = currentUser?.primaryRole ? ROLE_LABEL_MAP[currentUser.primaryRole] : '관심 역할 미설정';

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0064FF] text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              H
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F1E32]">Handover HQ</span>
          </Link>

          <nav className="ml-10 mr-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                  isActive(item.path)
                    ? 'bg-blue-50 text-[#0064FF] shadow-sm'
                    : 'text-[#5F6E82] hover:bg-[#F6F9FC] hover:text-[#0F1E32]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-[#D6DEE8] bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EBF5FF] font-bold text-[#0064FF]">
                    {currentUser.displayName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0F1E32]">{currentUser.displayName}</div>
                    <div className="truncate text-xs text-[#5F6E82]">{currentUser.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={currentUser.isDemo ? 'active' : 'submitted'}>
                      {currentUser.isDemo ? 'DEMO' : 'AUTH'}
                    </Badge>
                    <span className="text-[11px] font-medium text-[#5F6E82]">{roleLabel}</span>
                  </div>
                </div>
                <Button variant="outline" className="rounded-2xl shadow-sm" onClick={() => void signOut()}>
                  <SignOut size={16} />
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <div className="text-xs font-medium text-[#5F6E82]">
                  {isSupabaseReady ? 'Supabase Auth 연결 가능' : '로컬 데모 모드'}
                </div>
                <Button variant="outline" className="rounded-2xl shadow-sm" onClick={openAuthDialog}>
                  <Sparkle size={16} />
                  로그인 / 데모 시작
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-xl p-2 text-[#0F1E32] transition-colors hover:bg-[#F6F9FC] md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="bg-white/95 py-4 backdrop-blur-md md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'rounded-xl px-4 py-3 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2',
                    isActive(item.path)
                      ? 'bg-blue-50 text-[#0064FF] shadow-sm'
                      : 'text-[#5F6E82] hover:bg-[#F6F9FC] hover:text-[#0F1E32]'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-4 px-4">
                {currentUser ? (
                  <Button variant="outline" className="w-full rounded-2xl shadow-sm" onClick={() => void signOut()}>
                    <SignOut size={16} />
                    로그아웃
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl shadow-sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthDialog();
                    }}
                  >
                    <UserCircle size={16} />
                    로그인 / 데모 시작
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
