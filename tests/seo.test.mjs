import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, OG_IMAGE } from "../src/lib/seo.ts";

test("페이지 메타데이터는 고유 title/description/canonical과 공통 og:image를 갖는다", () => {
  const m = pageMetadata({ title: "별지도", description: "설명", path: "/starmap" });
  assert.equal(m.title, "별지도");
  assert.equal(m.description, "설명");
  assert.deepEqual(m.alternates, { canonical: "/starmap" });
  assert.equal(m.openGraph.url, "/starmap");
  assert.equal(m.openGraph.title, "별지도 | 별도리");
  assert.deepEqual(m.openGraph.images, [OG_IMAGE]);
});

test("OG 이미지 선언 크기가 실제 파일(1200x630)과 같다", async () => {
  const { readFile } = await import("node:fs/promises");
  const buf = await readFile(new URL("../public" + OG_IMAGE.url, import.meta.url));
  // JPEG SOF0/SOF2 마커에서 높이·너비를 읽는다
  let i = 2;
  let size = null;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      size = { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      break;
    }
    i += 2 + len;
  }
  assert.deepEqual(size, { width: OG_IMAGE.width, height: OG_IMAGE.height });
  assert.ok(buf.length < 200 * 1024, "OG 이미지는 200KB 미만");
});
