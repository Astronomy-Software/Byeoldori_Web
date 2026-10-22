// 중기 육상예보는 하루에 오전(tmEf=YYYYMMDD0000)·오후(YYYYMMDD1200) 두 행이 오고,
// 8~10일차처럼 하루 한 행(0000)만 오는 날도 있다.
export interface MidForecastSlots<T> {
  am?: T;
  pm?: T;
}

// 날짜(YYYYMMDD)별로 오전/오후를 묶는다. 12시 행은 오후다(<= "12"로 나누면 오후가 오전을 덮어쓴다).
export function groupMidForecastByDate<T extends { tmEf: string }>(
  items: readonly T[],
): [string, MidForecastSlots<T>][] {
  const byDate: Record<string, MidForecastSlots<T>> = {};
  for (const item of items) {
    const date = item.tmEf.slice(0, 8);
    if (!byDate[date]) byDate[date] = {};
    const hour = item.tmEf.slice(8, 10);
    if (hour < "12") byDate[date].am = item;
    else byDate[date].pm = item;
  }
  return Object.entries(byDate);
}

// 해당 시간대 예보가 없으면 0%로 지어내지 않고 대시로 표시한다.
export function midPrecipText(item: { rnSt: number | null } | undefined): string {
  return item?.rnSt != null ? `${item.rnSt}%` : "—";
}
