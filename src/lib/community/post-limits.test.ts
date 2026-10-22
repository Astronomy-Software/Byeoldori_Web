import { test } from "node:test";
import assert from "node:assert/strict";
import { exceedsImageLimit, POST_IMAGE_MAX_COUNT } from "./post-limits.ts";

test("exceedsImageLimit: 서버 한도(20장)까지는 허용하고 넘으면 막는다", () => {
  assert.equal(POST_IMAGE_MAX_COUNT, 20);
  assert.equal(exceedsImageLimit(0, 20), false);
  assert.equal(exceedsImageLimit(18, 2), false);
  assert.equal(exceedsImageLimit(18, 3), true);
  assert.equal(exceedsImageLimit(20, 1), true);
  assert.equal(exceedsImageLimit(0, 21), true);
});
