import { Outlet } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthDialog } from './AuthDialog';
import { ScrollToTop } from './ScrollToTop';
import { useAppContext } from '../hooks/useAppContext';

export function Layout() {
  const { currentUser, isSupabaseReady } = useAppContext();

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      {!isSupabaseReady && (
        <div className="border-b border-[#D6DEE8] bg-[#F6F9FC] px-6 py-3 text-sm text-[#5F6E82]">
          <div className="mx-auto max-w-6xl">Supabase 환경변수가 없어 현재는 localStorage 기반 데모 모드로 동작합니다.</div>
        </div>
      )}
      {currentUser?.isDemo && (
        <div className="border-b border-blue-100 bg-blue-50 px-6 py-3 text-sm text-[#0064FF]">
          <div className="mx-auto max-w-6xl">데모 계정으로 로그인되어 있습니다. 실제 배포 전에는 Supabase Auth를 연결하세요.</div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AuthDialog />
    </div>
  );
}
