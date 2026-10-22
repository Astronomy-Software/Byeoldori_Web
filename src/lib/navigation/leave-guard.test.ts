import { test } from "node:test";
import assert from "node:assert/strict";
import { isInAppLeaveClick } from "./leave-guard.ts";

const here = {
  origin: "https://byeoldori.com",
  pathname: "/community/program/author",
  search: "?id=abc",
};

function click(overrides: Partial<Parameters<typeof isInAppLeaveClick>[0]> = {}) {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    ...overrides,
  };
}

function anchor(href: string, target = "", attrs: string[] = []) {
  return { href, target, hasAttribute: (name: string) => attrs.includes(name) };
}

test("isInAppLeaveClick: NavBar 같은 앱 안 링크로 떠나면 true", () => {
  assert.equal(isInAppLeaveClick(click(), anchor("https://byeoldori.com/community"), here), true);
  assert.equal(isInAppLeaveClick(click(), anchor("/mypage"), here), true);
  // 같은 화면이라도 다른 프로그램(?id)으로 가면 편집 중인 내용이 사라진다
  assert.equal(
    isInAppLeaveClick(click(), anchor("/community/program/author?id=other"), here),
    true,
  );
});

test("isInAppLeaveClick: 새 탭·다운로드·외부 링크·해시 이동은 확인하지 않는다", () => {
  assert.equal(isInAppLeaveClick(click(), null, here), false);
  assert.equal(isInAppLeaveClick(click({ ctrlKey: true }), anchor("/mypage"), here), false);
  assert.equal(isInAppLeaveClick(click({ metaKey: true }), anchor("/mypage"), here), false);
  assert.equal(isInAppLeaveClick(click({ button: 1 }), anchor("/mypage"), here), false);
  assert.equal(isInAppLeaveClick(click({ defaultPrevented: true }), anchor("/mypage"), here), false);
  assert.equal(isInAppLeaveClick(click(), anchor("/mypage", "_blank"), here), false);
  assert.equal(isInAppLeaveClick(click(), anchor("/file.png", "", ["download"]), here), false);
  assert.equal(isInAppLeaveClick(click(), anchor("https://example.com/"), here), false);
  assert.equal(isInAppLeaveClick(click(), anchor("mailto:a@b.c"), here), false);
  assert.equal(
    isInAppLeaveClick(click(), anchor("/community/program/author?id=abc#steps"), here),
    false,
  );
});
