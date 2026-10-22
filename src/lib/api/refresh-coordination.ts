// 여러 탭이 같은 refresh 쿠키를 공유할 때 access 토큰 갱신을 조정한다.
// 서버는 reissue 때 refresh 토큰을 회전시키고 이전 토큰을 401로 거부하므로,
// 두 탭이 동시에 갱신하면 진 탭은 실패한다. 진 탭이 공유 localStorage를 지우면
// 이긴 탭이 방금 저장한 새 토큰까지 사라져 모든 탭이 로그아웃된다.

export const REFRESH_LOCK_NAME = "byeoldori-token-refresh";

// 이번 요청에 쓴 토큰과 지금 저장소의 토큰이 다르면(다른 탭이 이미 갱신) 그 토큰을 돌려준다.
export function tokenRefreshedElsewhere(
  usedToken: string,
  currentToken: string | null | undefined,
): string | null {
  const current = currentToken?.trim();
  if (!current || current === usedToken) return null;
  return current;
}

// refresh까지 실패해 토큰을 지운 뒤, 같은 요청을 Authorization 없이 한 번 더 보낸다.
// 서버는 만료 토큰이 붙어 있으면 공개(permitAll) API도 401로 막으므로, 익명으로 다시 보내면
// 비로그인 열람 API는 성공한다. 로그인이 필요한 API는 다시 401이 나고 sessionExpired=true가 된다.
export async function resendAnonymously(
  headers: Headers,
  send: (headers: Headers) => Promise<Response>,
): Promise<{ res: Response; sessionExpired: boolean }> {
  headers.delete("Authorization");
  const res = await send(headers);
  return { res, sessionExpired: res.status === 401 };
}

type LockManagerLike = {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
};

export interface CoordinatedRefreshDeps {
  readToken: () => string | null | undefined;
  refresh: () => Promise<boolean>;
  // navigator.locks — 없는 브라우저에서는 탭 안에서만 직렬화된다.
  locks?: LockManagerLike | null;
}

// 탭 사이 잠금 안에서 갱신한다. 잠금을 얻었을 때 다른 탭이 이미 토큰을 바꿨으면
// 서버에 다시 요청하지 않고(회전된 옛 refresh로 401을 받지 않도록) 성공으로 본다.
export async function coordinatedRefresh(
  staleToken: string,
  deps: CoordinatedRefreshDeps,
): Promise<boolean> {
  let started = false;
  const run = async () => {
    started = true;
    if (tokenRefreshedElsewhere(staleToken, deps.readToken())) return true;
    return deps.refresh();
  };
  if (deps.locks) {
    try {
      return await deps.locks.request(REFRESH_LOCK_NAME, run);
    } catch {
      // 잠금 API 자체 오류(보안 컨텍스트 아님 등)면 잠금 없이 진행한다.
      // 갱신이 이미 돌았다가 실패한 경우는 다시 요청하지 않는다.
      if (started) return false;
      return run();
    }
  }
  return run();
}
