// 관측 일정의 시작/종료 시각(서버 LocalDateTime: yyyy-MM-ddTHH:mm[:ss])을 목록용 문구로 만든다.
// 종료가 다른 날이면 날짜(MM-DD)를 붙여 밤을 넘기는 일정도 알아볼 수 있게 한다.
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

export function formatPlanTimeRange(
  startAt: string | null | undefined,
  endAt?: string | null,
): string | null {
  const start = startAt ? DATE_TIME.exec(startAt) : null;
  if (!start) return null;
  const startText = `${start[4]}:${start[5]}`;
  const end = endAt ? DATE_TIME.exec(endAt) : null;
  if (!end) return startText;
  const sameDay = start[1] === end[1] && start[2] === end[2] && start[3] === end[3];
  const endText = sameDay ? `${end[4]}:${end[5]}` : `${end[2]}-${end[3]} ${end[4]}:${end[5]}`;
  return `${startText} ~ ${endText}`;
}
