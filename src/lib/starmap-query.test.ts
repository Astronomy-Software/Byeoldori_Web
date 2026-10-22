import { test } from "node:test";
import assert from "node:assert/strict";
import { readProgramId } from "./starmap-query.ts";

test("readProgramId: programId 쿼리를 읽고 없거나 비면 null", () => {
  assert.equal(readProgramId("?programId=abc123"), "abc123");
  assert.equal(readProgramId("?foo=1&programId=%20xyz%20"), "xyz");
  assert.equal(readProgramId(""), null);
  assert.equal(readProgramId("?programId="), null);
  assert.equal(readProgramId("?programId=%20%20"), null);
});
