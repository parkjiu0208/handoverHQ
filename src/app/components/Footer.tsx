import { EnvelopeSimple, GithubLogo, TwitterLogo } from '@phosphor-icons/react';
import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#D6DEE8] bg-white">
      <div className="container mx-auto max-w-6xl px-6 py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0064FF]">
                <span className="text-xs font-bold text-white">H</span>
              </div>
              <span className="font-bold tracking-tight text-[#0F1E32]">Handover HQ</span>
            </div>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-[#5F6E82]">
              해커톤 참가부터 팀 모집, 프로젝트 제출, 결과 확인까지 한 곳에서 관리하는 운영 허브입니다.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#0F1E32]">서비스</h4>
            <ul className="space-y-4 text-sm font-medium text-[#5F6E82]">
              <li>
                <Link to="/hackathons" className="transition-colors hover:text-[#0064FF]">
                  해커톤 탐색
                </Link>
              </li>
              <li>
                <Link to="/camp" className="transition-colors hover:text-[#0064FF]">
                  팀 모집
                </Link>
              </li>
              <li>
                <Link to="/rankings" className="transition-colors hover:text-[#0064FF]">
                  랭킹
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#0F1E32]">지원</h4>
            <ul className="space-y-4 text-sm font-medium text-[#5F6E82]">
              <li>
                <a
                  href="https://supabase.com/docs/guides/auth"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-[#0064FF]"
                >
                  Auth 설정 가이드
                </a>
              </li>
              <li>
                <a
                  href="https://vercel.com/docs"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-[#0064FF]"
                >
                  Vercel 배포 문서
                </a>
              </li>
              <li>
                <a href="mailto:handoverhq@example.com" className="transition-colors hover:text-[#0064FF]">
                  문의하기
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#0F1E32]">연결</h4>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF3F8] text-[#5F6E82] transition-colors hover:bg-[#D6DEE8] hover:text-[#0F1E32]"
              >
                <GithubLogo size={18} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer noopener"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF3F8] text-[#5F6E82] transition-colors hover:bg-[#D6DEE8] hover:text-[#0F1E32]"
              >
                <TwitterLogo size={18} />
              </a>
              <a
                href="mailto:handoverhq@example.com"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF3F8] text-[#5F6E82] transition-colors hover:bg-[#D6DEE8] hover:text-[#0F1E32]"
              >
                <EnvelopeSimple size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#D6DEE8] pt-8 text-xs font-bold text-[#5F6E82]">
          <p>&copy; 2026 Handover HQ. Supabase Auth / Vercel 배포 기준으로 운영됩니다.</p>
        </div>
      </div>
    </footer>
  );
}
