// 관측지 시간별 예보의 강수 칸 표시.
// 초단기예보에는 강수확률(POP)이 없고 1시간 강수량(RN1, mm)만 있다.
// 두 값을 같은 '%'로 보여 주면 비 오는 시간이 확률 낮은 시간처럼 읽히므로 단위를 나눈다.
export type HourlyPrecip = {
  pop: number | null; // 강수확률(%) — 단기예보
  rainMm: number | null; // 1시간 강수량(mm) — 초단기예보
};

export function hourlyPrecipLabel(p: HourlyPrecip): { text: string; title: string } {
  if (p.pop != null && Number.isFinite(p.pop)) {
    return { text: `${Math.round(p.pop)}%`, title: "강수확률" };
  }
  if (p.rainMm != null && Number.isFinite(p.rainMm)) {
    const mm = Math.round(p.rainMm * 10) / 10;
    return { text: `${mm}mm`, title: "1시간 강수량" };
  }
  return { text: "—", title: "강수 정보 없음" };
}
