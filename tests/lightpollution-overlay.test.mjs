import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

// 관측지 지도의 광공해 오버레이는 '광공해 ON'을 누를 때 모바일 데이터로도 받으므로 가볍게 유지한다.
test("광공해 오버레이: 지도가 가리키는 파일이 있고 500KB 미만이며 원본과 같은 크기(2160x2040)다", async () => {
  const page = await readFile(
    new URL("../src/app/(main)/observatory/page.tsx", import.meta.url),
    "utf8",
  );
  const m = page.match(/"(\/korea_lightpollution_overlay[^"]*)"/);
  assert.ok(m, "observatory/page.tsx에서 오버레이 경로를 찾지 못했습니다");
  const file = new URL("../public" + m[1], import.meta.url);
  const { size } = await stat(file);
  assert.ok(size < 500 * 1024, `오버레이가 너무 큽니다: ${size}B`);

  const buf = await readFile(file);
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  assert.equal(buf.toString("ascii", 8, 12), "WEBP");
  // 투명도가 있는 WebP는 VP8X 청크에 캔버스 크기(-1, 24비트 리틀엔디언)를 둔다.
  assert.equal(buf.toString("ascii", 12, 16), "VP8X");
  const width = buf.readUIntLE(24, 3) + 1;
  const height = buf.readUIntLE(27, 3) + 1;
  assert.deepEqual([width, height], [2160, 2040]);
});

test("광공해 오버레이: 파일명 버전 규칙으로 1년 캐시된다", async () => {
  const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
  assert.match(
    headers,
    /\/korea_lightpollution_overlay_\*\r?\n\s+Cache-Control: public,max-age=31536000,immutable/,
  );
});
