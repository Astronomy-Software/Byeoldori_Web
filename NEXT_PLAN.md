# Byeoldori Web - 다음 단계 계획

## 현재 상태 (2026-04-13 기준)

### 완료 (Phase 1~3)
- [x] Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui 프로젝트 셋업
- [x] 우주 테마 다크 UI (앱 Color.kt Purple/Blue 팔레트 동일 적용)
- [x] API 클라이언트 + JWT 토큰 관리 (자동 갱신, 401 재시도)
- [x] Route Handler 프록시로 CORS 우회 (`src/app/api/[...path]/route.ts`)
- [x] 인증: 로그인, 회원가입, 이메일 찾기, 비밀번호 재설정
- [x] 홈: 관측 캘린더, 현재 날씨/관측적합도, 최근 게시물 요약
- [x] 커뮤니티: 자유게시판/관측리뷰/교육프로그램 (목록/상세/작성/댓글/좋아요)
- [x] 관측지: 네이버 지도 + 관측지 검색/추천
- [x] 마이페이지: 프로필 관리, 관측일정 CRUD, 설정
- [x] GitHub: `Seobeomsu/Byeoldori_Web`

### 미완료
- [ ] Google OAuth 웹 연동
- [ ] 좋아요 목록 API 연동 (서버에 엔드포인트 확인 필요)
- [ ] 내가 쓴 글/댓글 목록 (서버에 엔드포인트 확인 필요)
- [ ] 알림 기능 (서버 NotificationController 존재)
- [ ] GitHub 레포를 Astronomy-Software 조직으로 transfer

---

## Phase 4: 별지도 + 마스코트

### 4-1. 별지도 (Stellarium Web)
- **목표**: 앱의 StellariumScreen과 동일한 별지도를 웹에서 제공
- **선택지**:
  - stellarium-web-engine (공식 웹 엔진) — 가장 정확하지만 복잡
  - Celestial.js / d3-celestial — 2D 별자리 지도, 가벼움
  - Three.js + HYG star catalog — 3D 커스텀 구현
- **앱 자산**: `assets/StellariumServer/` 디렉토리에 skydata, skycultures, star catalog 등 존재
- **서버 연동**: `stars/{objectName}/reviews`, `stars/{objectName}/educations` API로 천체별 리뷰/교육 연결
- **관련 화면**: StellariumScreen, ObjectDetailScreen

### 4-2. Live2D 마스코트 (별도리 캐릭터)
- **목표**: 앱의 Live2DScreen처럼 마스코트 캐릭터를 웹에서도 오버레이
- **라이브러리**: pixi-live2d-display (웹용 Live2D SDK)
- **앱 자산**: `assets/byeoldori/byeoldori.1024/` + `assets/byeoldori/motion/`에 모델 파일 존재
- **구현 위치**: 메인 레이아웃의 floating overlay

---

## Phase 5: 품질 개선

### UI/UX
- [ ] 반응형 디자인 세밀 조정 (모바일 웹 최적화)
- [ ] 로딩 스켈레톤 추가 (현재 기본 spinner만 있음)
- [ ] 이미지 최적화 (Next.js Image 컴포넌트 활용)
- [ ] 페이지 전환 애니메이션
- [ ] 에러 바운더리 (error.tsx) 추가

### 기능
- [ ] 게시글 수정 화면 (현재 작성만 가능)
- [ ] 무한 스크롤 (커뮤니티 게시판)
- [ ] 실시간 알림 (WebSocket or SSE)
- [ ] PWA 지원 (오프라인, 홈 화면 추가)
- [ ] 다국어 지원 (i18n)

### 인프라
- [ ] Vercel 배포 설정
- [ ] 프로덕션 서버 CORS에 배포 도메인 추가 (Cloud Run 환경변수)
- [ ] CI/CD (GitHub Actions → Vercel 자동 배포)
- [ ] Sentry 에러 모니터링

---

## 기술 참고

### 백엔드 서버
- **프로덕션 URL**: `https://byeoldori-server-hbxnfn4woa-du.a.run.app`
- **Swagger UI**: `https://byeoldori-server-hbxnfn4woa-du.a.run.app/swagger-ui.html`
- **API prefix 없음**: 엔드포인트가 `/auth/login` 형태 (`/api/` 없음)
- **인증**: JWT (Access + Refresh), Google OAuth2
- **CORS**: `SecurityConfig.kt`에서 `CORS_ALLOWED_ORIGINS` 환경변수로 관리
- **호스팅**: Google Cloud Run (asia-northeast3)

### 웹 프로젝트 구조
```
src/
├── app/
│   ├── api/[...path]/route.ts   # 백엔드 프록시 (CORS 우회)
│   ├── (auth)/                  # 인증 화면 (로그인, 회원가입 등)
│   ├── (main)/                  # 메인 화면 (AuthGuard 포함)
│   │   ├── home/
│   │   ├── community/
│   │   ├── observatory/
│   │   └── mypage/
│   └── layout.tsx
├── components/                  # 공유 컴포넌트
├── lib/
│   ├── api/                     # 도메인별 API 함수 (auth, community, calendar 등)
│   └── auth/token.ts            # JWT 토큰 저장/갱신
├── stores/auth-store.ts         # Zustand 인증 상태
└── types/api.ts                 # 서버 DTO 타입 정의
```

### 앱 Color 팔레트 (Color.kt → globals.css)
| 이름 | HEX | 용도 |
|---|---|---|
| Purple500 | #8459C9 | Primary 색상 |
| Purple800 | #48287B | 네비게이션 바 배경 |
| Blue900 | #0F163A | 앱 전체 배경 |
| TextHighlight | #FAFAFA | 주요 텍스트 |
| TextNormal | #E0E0E0 | 일반 텍스트 |
| SuccessGreen | #6EFFA6 | 성공/완료 |
| WarningYellow | #FFD76B | 경고/예정 |
| ErrorRed | #FF6B6B | 에러/미완료 |
