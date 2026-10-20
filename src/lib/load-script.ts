// 외부 <script>를 id 기준으로 한 번만 주입하고, 로드 완료를 Promise로 돌려준다.
// 이미 같은 id의 태그가 있으면(다른 페이지가 넣었고 아직 로딩 중인 경우 포함) 새로 넣지 않고
// 그 태그의 load 이벤트를 기다린다. isReady()가 참이면 즉시 resolve한다.

type ScriptDoc = Pick<Document, "getElementById" | "createElement" | "head">;

const pending = new Map<string, Promise<void>>();

export function loadScriptOnce(
  id: string,
  src: string,
  isReady: () => boolean,
  doc: ScriptDoc = document,
): Promise<void> {
  if (isReady()) return Promise.resolve();
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;

  const promise = new Promise<void>((resolve, reject) => {
    let el = doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = doc.createElement("script");
      el.id = id;
      el.src = src;
      el.async = true;
      doc.head.appendChild(el);
    }
    el.addEventListener(
      "load",
      () => {
        pending.delete(id);
        resolve();
      },
      { once: true },
    );
    const script = el;
    script.addEventListener(
      "error",
      () => {
        pending.delete(id);
        // 실패한 태그를 남겨 두면 다음 시도가 오지 않을 load를 기다리게 되므로 걷어낸다.
        script.remove();
        reject(new Error(`스크립트 로드 실패: ${id}`));
      },
      { once: true },
    );
  });
  pending.set(id, promise);
  return promise;
}
