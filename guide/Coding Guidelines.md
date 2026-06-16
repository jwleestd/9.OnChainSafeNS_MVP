# [P] Coding Guidelines

이 문서는 Phase-0 (Actionable MVP) 구현을 위한 에이전트 핵심 행동 지침(Coding Guidelines)입니다.
프로젝트의 모든 코드 작성 및 의사 결정은 아래 합의된 24건의 제약사항을 우선적으로 따릅니다.

## 1. 아키텍처 및 기술 스택
- **프레임워크:** Next.js 14.2.x (App Router 단일 풀스택)
- **DB:** Supabase PostgreSQL 단일 사용, Prisma ORM
- **아키텍처 (2계층):**
  - Route Handler(`app/api/v1/**/route.ts`)에서 HTTP 파싱, 비즈니스 로직, Prisma 쿼리(직접 호출), 응답을 모두 처리합니다.
  - 별도의 Service 파일(`fraud.ts`, `safe-name.ts` 등)은 만들지 않습니다.
  - `lib/` 폴더에는 이메일(Resend), 검증(validators), Prisma 싱글턴 등 공통 유틸리티만 위치합니다.
- **UI/디자인:** Tailwind CSS + shadcn/ui. `next-themes`를 사용해 라이트/다크모드 모두 지원합니다.

## 2. 보안 및 인증 (Phase-0)
- **일반 유저 인증:**
  - POST `/api/v1/auth/verify-email`에서 6자리 코드 인증 성공 시 `user_session` (httpOnly, Secure, HMAC 서명, 7일 만료) 쿠키를 발급합니다.
  - 응답 본문은 데이터 최소화 원칙에 따라 `{ "success": true }`만 반환하며, 클라이언트가 React 상태로 이메일을 보관해 화면에 표시합니다.
  - 미인증 유저가 보호된 액션(신고, 등록, 이체) 시도 시 인라인 경고 Alert("이메일 인증이 필요합니다")와 함께 `/auth/verify?redirect=...`로 보냅니다.
- **운영자(Admin) 인증:**
  - `/auth/admin-login` 페이지에서 ID/PW로 로그인합니다.
  - `admin_session` (httpOnly, 서명됨) 쿠키를 발급하며, 기본 만료 시간은 30분(`ADMIN_SESSION_MINUTES` 환경변수)입니다.
  - `middleware.ts`를 통해 `/(admin)` 하위 라우트 접근을 보호합니다.

## 3. 핵심 비즈니스 로직
- **Safe-Name 규칙:**
  - 유저는 `.safe`를 붙이지 않고 입력하며, 서버가 자동 부착하여 DB에 저장(`alice.safe`)합니다.
  - 리졸브 시 `.safe` 유무와 관계없이 양방향으로 동작해야 합니다.
  - 특정 단어들(`admin`, `police`, `binance` 등)은 예약어로 차단합니다.
- **사기 주소 승인/상향:**
  - `FRAUD_ADDRESS`는 운영자가 승인하는 시점에만 신규 생성되거나 `report_count`가 갱신됩니다.
  - 사기 신고는 증빙 URL(`evidence_url`)이 필수입니다.
  - 누적 신고 수 5건 이상 시 `high`, 10건 이상 시 `critical`로 위험도가 자동 상향됩니다.
  - 허위 신고(운영자 판단) 거부 시 유저의 `false_report_count`가 증가하며, 3회 누적 시 30일간 신고가 자동 차단(Auto-ban)됩니다.
  - `FRAUD_ADDRESS` 상태(`status`)는 `verified`, `inactive`, `appealed` 3가지를 가집니다.
- **데모 이체 (시뮬레이션):**
  - 이메일 인증된 유저만 데모 이체를 실행할 수 있습니다.
  - 수신자 Safe-Name과 금액을 입력하면 리졸브 및 사기 검증을 수행하고, 결과(완료/차단)를 `TRANSFER_DEMO` 테이블에 기록합니다.
  - 사기 주소(FRAUD_ADDRESS)인 경우 즉시 강제 차단(Hard Block)합니다.
- **이메일 통지 (Resend):**
  - 신고 접수, 승인/거부 결과, 데모 이체 결과(차단/완료)에 대해 이메일을 통지합니다.
  - Phase-0에서는 이메일 발송 실패 시 재시도하지 않고 단순 에러 로그(Vercel Logs)만 기록합니다.
