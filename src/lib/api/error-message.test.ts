import { test } from "node:test";
import assert from "node:assert/strict";
import { clientErrorMessage } from "./error-message.ts";

const FALLBACK = "프로필 수정에 실패했습니다.";

test("clientErrorMessage: 4xx는 서버 이유(닉네임 중복·길이 초과)를 보여준다", () => {
  assert.equal(
    clientErrorMessage({ status: 409, body: "이미 사용 중인 닉네임입니다." }, FALLBACK),
    "이미 사용 중인 닉네임입니다.",
  );
  assert.equal(
    clientErrorMessage({ status: 400, body: "닉네임은 20자 이하로 입력해주세요." }, FALLBACK),
    "닉네임은 20자 이하로 입력해주세요.",
  );
});

test("clientErrorMessage: 401·5xx·네트워크 오류·이상한 본문은 기본 문구", () => {
  assert.equal(clientErrorMessage({ status: 401, body: "Session expired" }, FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage({ status: 500, body: "NullPointerException" }, FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage(new TypeError("Failed to fetch"), FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage({ status: 400, body: "" }, FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage({ status: 400, body: "<html>err</html>" }, FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage({ status: 400, body: "x".repeat(300) }, FALLBACK), FALLBACK);
  assert.equal(clientErrorMessage(null, FALLBACK), FALLBACK);
});
