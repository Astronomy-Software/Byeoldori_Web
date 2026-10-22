// 일정 화면의 ?date=YYYY-MM-DD 쿼리(홈 캘린더에서 날짜를 눌러 들어온 경우)를 읽는다.
// 형식이 틀리거나 없는 날짜(2월 30일 등)면 null — 화면은 기본 상태로 연다.
export function parseDateParam(
  raw: string | null | undefined,
): { date: string; year: number; month: number } | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > lastDay) return null;
  return { date: raw, year, month };
}

export function scheduleHrefForDate(date: string): string {
  return `/mypage/schedule?date=${encodeURIComponent(date)}`;
}
