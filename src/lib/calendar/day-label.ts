// 달력 날짜 버튼의 스크린리더용 이름. 오늘·일정 있음은 화면에서 색으로만 보이므로 글로 덧붙인다.
export function calendarDayLabel(
  month: number,
  day: number,
  opts: { isToday?: boolean; hasPlan?: boolean } = {},
): string {
  let label = `${month}월 ${day}일`;
  if (opts.isToday) label += ", 오늘";
  if (opts.hasPlan) label += ", 일정 있음";
  return label;
}
