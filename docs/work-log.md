# 작업 로그

## 2026-03-24
- 설계 문서와 현재 구현 화면을 비교 분석했다.
- 기획, 디자인, 코딩/보안 에이전트를 병렬로 사용해 누락 기능과 리스크를 정리했다.
- Supabase Auth/Database/Storage와 localStorage 데모 폴백을 함께 쓰는 구조로 방향을 확정했다.
- 문서, 환경설정, 인증 계층, 공통 데이터 구조, 핵심 화면 연결을 작업 단위로 분리했다.
- `feat: stabilize app state and hackathon workflows` 커밋으로 공통 Provider, AuthDialog, 홈/목록/상세/팀 모집/랭킹 화면을 실제 데이터 구조에 맞게 전환했다.
- 제출 폼에 자동 저장, 초안 저장, 최종 제출 확인, 버전 이력 UI를 추가했다.
- URL 검증을 강화해 로컬호스트/사설 IP 차단과 GitHub 저장소 URL 검증을 적용했다.
- `npm run typecheck`, `npm run build`를 통과했다.
