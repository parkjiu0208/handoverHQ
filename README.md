# Handover HQ

해커톤 탐색, 팀 빌딩, 제출 가드, 리더보드 확인까지 한 흐름으로 이어지는 운영 허브입니다.  
피그마 기반 정적 화면을 React + TypeScript + Supabase 구조로 전환했고, Supabase 환경변수가 없을 때는 `localStorage` 기반 데모 모드로 동작합니다.

## 기술 스택
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand Persist
- React Hook Form + Zod
- Supabase Auth / Database / RLS
- Vercel

## 실행 방법
1. 의존성 설치
```bash
npm install
```

2. 환경변수 설정
```bash
cp .env.example .env.local
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 타입체크 / 빌드
```bash
npm run typecheck
npm run build
```

## 환경변수
클라이언트 공개용:

```env
VITE_APP_NAME=Handover HQ
VITE_APP_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SUBMISSION_BUCKET=hackathon-submissions
```

서버 전용:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

주의:
- `VITE_` 접두사가 붙은 값만 브라우저 번들에 노출됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 `VITE_`로 두면 안 됩니다.
- Vercel에서는 `Development`, `Preview`, `Production` 환경에 각각 동일한 키를 등록해야 합니다.

## 현재 구현 범위
- 홈: Next Action, 핵심 CTA, 진행 중 해커톤/팀/마감 지표
- 해커톤 목록: 검색, 상태/태그 필터, 마감일/최신순 정렬
- 해커톤 상세: 개요, 안내, 평가, 상금, 일정, 팀, 제출, 리더보드 탭
- 팀 모집: 팀 생성/수정, Team Fit, 연락 링크
- 제출: 자동 저장, 초안 저장, 최종 제출 확인 모달, 버전 이력, 팀장 전용 제출 권한, Supabase Storage PDF 업로드
- 랭킹: 기간 필터, 상위 3팀 카드, 전체 순위표

## 이번 라운드 보강 사항
- 로그인 전에 입력한 이름, 관심 역할, 복귀 URL을 pending profile로 저장하고, 로그인 복귀 후 Auth metadata와 `profiles`를 함께 동기화합니다.
- 해커톤 상세 탭은 URL hash를 사용하므로 `#submit`, `#leaderboard` deep link와 로그인 복귀 경로가 유지됩니다.
- 솔루션 PDF는 Supabase Storage 업로드를 우선 지원하고, 필요 시 공개 PDF URL 입력으로 대체할 수 있습니다.
- 제출 저장과 최종 제출은 팀장만 가능하며, 팀원은 읽기 전용으로 제출 상태와 버전 이력을 확인합니다.

## Supabase 적용 순서
1. `supabase/schema.sql`을 실행해 테이블, 트리거, Storage bucket, RLS 정책을 생성합니다.
2. Supabase Dashboard의 Auth URL 설정에 로컬/프리뷰/운영 리다이렉트 URL을 등록합니다.
3. `.env.local` 또는 Vercel Environment Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SUBMISSION_BUCKET`를 설정합니다.
4. `SUPABASE_SERVICE_ROLE_KEY`까지 준비한 뒤 `npm run seed:supabase`로 초기 데이터를 넣습니다.
5. Vercel 배포 시 `vercel.json`의 SPA rewrite를 유지합니다.

## Supabase 시드 데이터 넣기
`.env.local`에 실제 Supabase 값이 들어간 뒤 아래 명령으로 초기 데이터를 채울 수 있습니다.

```bash
npm run seed:supabase
```

이 스크립트는 다음 데이터를 자동으로 생성하거나 갱신합니다.
- Auth 사용자 + `profiles`
- `hackathons`
- `teams`
- `team_members`
- `submissions`
- `submission_versions`
- `leaderboard_entries`

## 배포
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

`vercel.json`은 React Router SPA 라우팅을 위해 모든 경로를 `index.html`로 rewrite 합니다.

## 운영 체크리스트
- Supabase Dashboard에서 `Site URL`, `Redirect URLs`에 로컬, Vercel Preview, 운영 도메인을 모두 등록합니다.
- 필요하면 GitHub OAuth provider를 활성화하고 callback URL을 Supabase에 등록합니다.
- `npm run seed:supabase` 후 로그인 → 팀 생성 → PDF 업로드 → 제출 저장 흐름을 실제로 검증합니다.

## 문서
- [실서비스 전환 기획서](/Users/jiu/Desktop/Projects/dacon_hack/docs/실서비스-전환-기획서.md)
- [구현 계획](/Users/jiu/Desktop/Projects/dacon_hack/docs/implementation-plan.md)
- [작업 로그](/Users/jiu/Desktop/Projects/dacon_hack/docs/작업로그.md)
