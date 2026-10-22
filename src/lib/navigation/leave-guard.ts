// 저장하지 않은 편집이 있는 화면에서 앱 안 링크(NavBar 등)를 눌러 떠나는지 판단한다.
// 클라이언트 이동은 beforeunload가 울리지 않으므로 링크 클릭을 직접 가로채 확인을 받는다.

export const UNSAVED_LEAVE_MESSAGE = "저장하지 않은 변경 사항이 있습니다. 나가시겠습니까?";

type ClickLike = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

type AnchorLike = {
  href: string;
  target: string;
  hasAttribute(name: string): boolean;
};

type LocationLike = { origin: string; pathname: string; search: string };

// 현재 탭에서 앱 안의 다른 화면으로 이동하는 링크 클릭이면 true.
// 새 탭(수정키·target)·다운로드·외부 링크(beforeunload가 막는다)·같은 화면의 해시 이동은 제외한다.
export function isInAppLeaveClick(
  event: ClickLike,
  anchor: AnchorLike | null,
  current: LocationLike,
): boolean {
  if (!anchor || event.defaultPrevented) return false;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href, current.origin);
  } catch {
    return false;
  }
  if (url.origin !== current.origin) return false;
  if (url.pathname === current.pathname && url.search === current.search) return false;
  return true;
}
