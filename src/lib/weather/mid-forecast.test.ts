import { test } from "node:test";
import assert from "node:assert/strict";
import { groupMidForecastByDate, midPrecipText } from "./mid-forecast.ts";

const row = (tmEf: string, rnSt: number | null = 10) => ({ tmEf, rnSt });

test("groupMidForecastByDate: 0000은 오전, 1200은 오후로 나눈다", () => {
  const groups = groupMidForecastByDate([
    row("202610240000", 20),
    row("202610241200", 60),
    row("202610250000", 30),
    row("202610251200", 70),
  ]);
  assert.deepEqual(
    groups.map(([date, { am, pm }]) => [date, am?.rnSt, pm?.rnSt]),
    [
      ["20261024", 20, 60],
      ["20261025", 30, 70],
    ],
  );
});

test("groupMidForecastByDate: 하루 한 행(0000)만 오는 날은 오전만 채운다", () => {
  const [[date, slots]] = groupMidForecastByDate([row("202610300000", 40)]);
  assert.equal(date, "20261030");
  assert.equal(slots.am?.rnSt, 40);
  assert.equal(slots.pm, undefined);
});

test("midPrecipText: 예보가 없으면 0%가 아니라 대시", () => {
  assert.equal(midPrecipText(row("202610241200", 60)), "60%");
  assert.equal(midPrecipText(row("202610241200", 0)), "0%");
  assert.equal(midPrecipText(undefined), "—");
  assert.equal(midPrecipText(row("202610241200", null)), "—");
});
