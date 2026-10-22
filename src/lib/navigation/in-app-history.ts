// '돌아가기' 버튼이 사이트 밖(공유 링크를 연 메신저·OAuth 제공자 화면)이나
// 아무 데도 가지 않는(새 탭·인앱 브라우저) router.back() 대신 쓸 대체 경로를 고른다.
//
// 브라우저 기록 항목마다 "앱 안에서 몇 번째로 쌓인 항목인지"를 history.state에 적어 둔다.
// pushState로 쌓인 항목은 바로 앞 항목 + 1, replaceState는 현재 항목의 값을 유지한다.
// 뒤로/앞으로 가기(popstate)는 브라우저가 그 항목의 state를 되돌려 주므로 위치가 그대로 맞는다.
// 값이 없으면(직접 진입·전체 새로고침 이동 등) 0으로 보고 대체 경로를 쓴다.

const INDEX_KEY = "__byeoldoriInAppIndex";

type HistoryLike = Pick<History, "state" | "pushState" | "replaceState">;

const installed = new WeakSet<object>();

export function inAppIndex(state: unknown): number {
  if (!state || typeof state !== "object") return 0;
  const value = (state as Record<string, unknown>)[INDEX_KEY];
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

function withIndex(data: unknown, index: number): unknown {
  if (index <= 0) return data;
  if (data === null || data === undefined) return { [INDEX_KEY]: index };
  if (typeof data !== "object" || Array.isArray(data)) return data;
  return { ...(data as Record<string, unknown>), [INDEX_KEY]: index };
}

// (main) 레이아웃의 추적 컴포넌트가 한 번 부른다. 같은 history에 두 번 감싸지 않는다.
export function installInAppHistory(history: HistoryLike): void {
  if (installed.has(history)) return;
  installed.add(history);
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function pushState(data, unused, url) {
    return push.call(history, withIndex(data, inAppIndex(history.state) + 1), unused, url);
  };
  history.replaceState = function replaceState(data, unused, url) {
    return replace.call(history, withIndex(data, inAppIndex(history.state)), unused, url);
  };
}

// 현재 항목 뒤에 앱 안에서 쌓인 기록이 있을 때만 true.
export function canGoBackInApp(state: unknown): boolean {
  return inAppIndex(state) > 0;
}

export function goBack(
  router: { back(): void; replace(href: string): void },
  fallback: string,
): void {
  let state: unknown = null;
  try {
    state = typeof window === "undefined" ? null : window.history.state;
  } catch {
    state = null;
  }
  if (canGoBackInApp(state)) router.back();
  else router.replace(fallback);
}
