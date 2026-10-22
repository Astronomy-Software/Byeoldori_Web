// '돌아가기' 버튼이 사이트 밖(공유 링크를 연 메신저·OAuth 제공자 화면)이나
// 아무 데도 가지 않는(새 탭·인앱 브라우저) router.back() 대신 쓸 대체 경로를 고른다.
// 이 문서를 연 뒤 앱 안에서 다른 화면으로 이동한 적이 있을 때만 브라우저 기록을 믿는다.

let lastPathname: string | null = null;
let inAppNavigations = 0;

// (main) 레이아웃의 추적 컴포넌트가 경로가 바뀔 때마다 부른다.
export function recordPathname(pathname: string): void {
  if (lastPathname !== null && lastPathname !== pathname) inAppNavigations += 1;
  lastPathname = pathname;
}

export function canGoBackInApp(historyLength: number): boolean {
  return inAppNavigations > 0 && historyLength > 1;
}

export function goBack(
  router: { back(): void; replace(href: string): void },
  fallback: string,
): void {
  const historyLength = typeof window === "undefined" ? 0 : window.history.length;
  if (canGoBackInApp(historyLength)) router.back();
  else router.replace(fallback);
}

// 테스트 전용
export function resetInAppHistoryForTest(): void {
  lastPathname = null;
  inAppNavigations = 0;
}
