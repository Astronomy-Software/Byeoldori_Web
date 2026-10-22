// /starmap?programId= 값을 읽는다.
// 별지도 페이지는 useSearchParams 대신 effect 안에서 location.search를 이 함수로 읽는다.
// useSearchParams는 정적 프리렌더에서 가장 가까운 Suspense까지 CSR로 빠뜨려
// 프리렌더 HTML에 Stellarium iframe·본문이 없어지고 엔진 로드가 늦어지기 때문이다.
export function readProgramId(search: string): string | null {
  const id = new URLSearchParams(search).get("programId");
  return id && id.trim() ? id.trim() : null;
}
