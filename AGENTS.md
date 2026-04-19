<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:live2d-license-rules -->
# Live2D Cubism SDK — 커밋 금지 사항

Live2D Cubism SDK (Core, Web Framework, Native Framework)는 Live2D Inc. 독점 라이선스로, 수정·재배포가 제한된다. 이 repo에는 **절대 커밋하지 않는다**. Git 레벨에서 3단 방어가 걸려있다 (`.gitignore` / `.husky/pre-commit` / `.github/workflows/live2d-license-check.yml`).

## 절대 커밋 금지

- `live2dcubismcore.min.js`, `live2dcubismcore.js`, `Live2DCubismCore.*`
- `CubismSdkForWeb/`, `CubismSdkForJava/`, `CubismWebFramework/`, `CubismWebSamples/`, `CubismNativeFramework/`
- 그 외 Live2D Inc.가 배포한 SDK 소스/샘플/바이너리 일체

## 허용되는 Live2D 관련 작업

- **Cubism Core 런타임 로드**: `https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js` 에서 `<script>` 태그로 동적 주입만 허용 (예: `src/components/live2d-character.tsx`)
- **렌더러**: npm 패키지 `pixi-live2d-display` 사용 (MIT 라이선스)
- **자체 모델 자산**: `public/live2d/byeoldori/` 아래의 `.moc3`, `.model3.json`, 텍스처, 모션 파일은 **우리 소유 창작물**이므로 커밋 가능

## 문제 발생 시

- pre-commit hook이 커밋을 차단하는 경우: 문제 파일을 unstage하고 원인 제거
- GitHub Actions가 PR을 차단하는 경우: 해당 파일을 완전히 제거 후 force-push 또는 revert
- SDK 소스를 참고해야 하는 경우: 이 repo 밖 별도 디렉토리에 두고 참고만 하기
<!-- END:live2d-license-rules -->

<!-- BEGIN:stellarium-integration -->
# Stellarium Web 통합 (subtree 관리)

Stellarium Web Engine은 `vendor/stellarium-web-engine/` 에 git subtree로 통합되어 있다.

## 빌드
```bash
npm run build:stellarium
```
환경변수로 `/stellarium/` 경로에 맞게 자동 커스터마이징된다:
- `CDN_ENV=/stellarium/` → webpack publicPath
- `VUE_APP_EXTRA_HEAD_CONTENT` → iframe history 경로 리셋 스크립트 주입

## Upstream 업데이트 반영
```bash
npm run update:stellarium   # git subtree pull 수행
npm run build:stellarium    # 재빌드
```
merge 충돌 발생 시 수동 해결 후 재빌드.

## 커스터마이징 원칙

- **가능하면 환경변수만 사용** (현재 설정: publicPath + head 주입)
- 소스 수정이 꼭 필요하면 `vendor/stellarium-web-engine/` 내부에서 일반 커밋으로 기록 — `git subtree pull` 시 merge로 처리됨
- `apps/web-frontend/package.json`의 `vue: ^2.6.11` 고정은 upstream 버그 우회 (원본은 `^3.0.0`으로 잘못 표기됐지만 실제 코드는 Vue 2 기반)
<!-- END:stellarium-integration -->
