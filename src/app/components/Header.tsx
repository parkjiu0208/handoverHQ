import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { CaretDown, List, SignOut, Sparkle, UserCircle, X } from '@phosphor-icons/react';
import { Button } from './Button';
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { currentUser, isSupabaseReady, openAuthDialog, signOut } = useAppContext();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const roleLabel = currentUser?.primaryRole ? ROLE_LABEL_MAP[currentUser.primaryRole] : '관심 역할 미설정';

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-sm transition-transform group-hover:scale-105">
              <img src="/handoverhq-mark.png" alt="Handover HQ 로고" className="h-full w-full object-cover" />
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
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D6DEE8] bg-white px-2.5 py-2 text-left shadow-sm transition-colors hover:border-[#C5D0DE] hover:bg-[#F9FBFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EBF5FF] text-sm font-bold text-[#0064FF]">
                    {currentUser.displayName.slice(0, 1)}
                  </div>
                  <span className="max-w-[120px] truncate text-sm font-semibold text-[#0F1E32]">
                    {currentUser.displayName}
                  </span>
                  <CaretDown
                    size={14}
                    className={cn('text-[#5F6E82] transition-transform', profileMenuOpen && 'rotate-180')}
                  />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-2xl border border-[#D6DEE8] bg-white p-2 shadow-[0_18px_45px_rgba(15,30,50,0.12)]">
                    <div className="rounded-[18px] bg-[#F6F9FC] px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-sm font-bold text-[#0064FF]">
                          {currentUser.displayName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[#0F1E32]">{currentUser.displayName}</div>
                          <div className="mt-1 truncate text-xs text-[#5F6E82]">{currentUser.email}</div>
                          <div className="mt-3 text-[11px] font-medium text-[#5F6E82]">{roleLabel}</div>
                          {currentUser.isDemo && (
                            <div className="mt-1 text-[11px] font-medium text-[#0064FF]">데모 계정</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        void signOut();
                      }}
                      className="mt-2 flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold text-[#0F1E32] transition-colors hover:bg-[#F6F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2"
                    >
                      <span>로그아웃</span>
                      <SignOut size={16} className="text-[#5F6E82]" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="outline" className="rounded-2xl shadow-sm" onClick={openAuthDialog}>
                <Sparkle size={16} className="shrink-0" />
                {isSupabaseReady ? '로그인' : '데모 시작'}
              </Button>
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
                  <div className="rounded-2xl bg-[#F6F9FC] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-sm font-bold text-[#0064FF]">
                        {currentUser.displayName.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[#0F1E32]">{currentUser.displayName}</div>
                        <div className="truncate text-xs text-[#5F6E82]">{currentUser.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs font-medium text-[#5F6E82]">{roleLabel}</div>
                    {currentUser.isDemo && <div className="mt-1 text-xs font-medium text-[#0064FF]">데모 계정</div>}
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-[#0F1E32] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0064FF] focus-visible:ring-offset-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void signOut();
                      }}
                    >
                      <SignOut size={16} />
                      로그아웃
                    </button>
                  </div>
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
