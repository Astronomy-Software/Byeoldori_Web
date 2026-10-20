// 리뷰 작성 폼의 자유 입력 관측지 이름을 등록된 관측지와 맞춰 본다.
// 공백 차이만 무시하고 이름이 정확히 같을 때만 매칭한다(부분 일치로 엉뚱한 관측지에 붙지 않게).

function normalizeName(name: string): string {
  return name.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

export function matchSiteByName<T extends { id: number; name: string }>(
  name: string,
  sites: readonly T[],
): T | undefined {
  const key = normalizeName(name);
  if (!key) return undefined;
  return sites.find((s) => normalizeName(s.name) === key);
}
