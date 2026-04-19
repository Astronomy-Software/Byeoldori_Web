#!/usr/bin/env node
// Byeoldori Web 배포 스크립트 (Node.js)
//
// 동작:
//   1) Discord에 "배포 시작" 알림
//   2) vercel deploy --prod --yes 실행
//   3) 성공/실패에 따라 Discord에 결과 알림
//
// 실행: npm run deploy

import { execFileSync, spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// ─────────────────────────────────────────────
// .env.local 로드
// ─────────────────────────────────────────────
if (existsSync(".env.local")) {
  const envText = readFileSync(".env.local", "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
if (!DISCORD_WEBHOOK_URL) {
  console.error("❌ DISCORD_WEBHOOK_URL 이 설정되지 않았다. .env.local 에 추가하라.");
  process.exit(1);
}

// ─────────────────────────────────────────────
// Git 커밋 정보 (execFileSync — no shell)
// ─────────────────────────────────────────────
const git = (args, fallback = "") => {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
};

const COMMIT_SHA = git(["rev-parse", "--short", "HEAD"], "unknown");
const COMMIT_MSG = git(["log", "-1", "--pretty=%s"]);
const COMMIT_AUTHOR = git(["log", "-1", "--pretty=%an"], "unknown");
const BRANCH = git(["rev-parse", "--abbrev-ref", "HEAD"], "unknown");
const REPO_URL = git(["remote", "get-url", "origin"]).replace(/\.git$/, "");

const commitLink = REPO_URL
  ? `[\`${COMMIT_SHA}\`](${REPO_URL}/commit/${COMMIT_SHA})`
  : `\`${COMMIT_SHA}\``;

// ─────────────────────────────────────────────
// Discord 알림
// ─────────────────────────────────────────────
const COLORS = {
  started: 5793266,
  success: 5763719,
  error: 15548997,
};

async function notifyDiscord(title, color, extraFields = []) {
  const embed = {
    title,
    color,
    fields: [
      { name: "Branch", value: BRANCH || "-", inline: true },
      { name: "Author", value: COMMIT_AUTHOR || "-", inline: true },
      {
        name: "Commit",
        value: `${commitLink} · ${COMMIT_MSG || "(no message)"}`.slice(0, 1000),
        inline: false,
      },
      ...extraFields,
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "byeoldori-web" },
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      console.warn(`⚠️ Discord 응답: ${res.status} ${res.statusText}`);
    }
  } catch (e) {
    console.warn(`⚠️ Discord 전송 실패:`, e.message);
  }
}

// ─────────────────────────────────────────────
// Vercel 배포 실행 (execFile 스타일, OS별 실행파일)
// ─────────────────────────────────────────────
// Node 20+ Windows에서 .cmd 파일 spawn 은 shell 옵션이 필요하다.
// 커맨드/인자가 모두 하드코딩이므로 injection 위험 없음.
const isWin = process.platform === "win32";

const START = Date.now();

console.log("🚀 Discord: 배포 시작 알림");
await notifyDiscord("🚀 배포 시작", COLORS.started);

console.log("📦 vercel deploy --prod 실행");
const deploy = spawn("vercel", ["deploy", "--prod", "--yes"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: isWin, // Windows에서만 shell 사용 (vercel.cmd 해석)
});

let stdoutBuf = "";
let stderrBuf = "";
deploy.stdout.on("data", (d) => {
  const s = d.toString();
  stdoutBuf += s;
  process.stdout.write(s);
});
deploy.stderr.on("data", (d) => {
  const s = d.toString();
  stderrBuf += s;
  process.stderr.write(s);
});

deploy.on("error", async (err) => {
  console.error(`❌ vercel 실행 오류:`, err.message);
  await notifyDiscord("❌ 배포 실패", COLORS.error, [
    { name: "Error", value: `\`\`\`${err.message}\`\`\``, inline: false },
  ]);
  process.exit(1);
});

deploy.on("close", async (code) => {
  const durationSec = Math.round((Date.now() - START) / 1000);
  const durationStr = `${Math.floor(durationSec / 60)}분 ${durationSec % 60}초`;

  const allOutput = stdoutBuf + "\n" + stderrBuf;
  const urlMatch = allOutput.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/);
  const deployUrl = urlMatch ? urlMatch[0] : null;

  if (code === 0) {
    console.log(`\n✅ 배포 성공 (${durationStr}): ${deployUrl ?? ""}`);
    const fields = [{ name: "Duration", value: durationStr, inline: true }];
    if (deployUrl) {
      fields.push({ name: "URL", value: deployUrl, inline: false });
    }
    await notifyDiscord("✅ 배포 완료", COLORS.success, fields);
  } else {
    console.log(`\n❌ 배포 실패 (${durationStr}), exit code ${code}`);
    const fields = [{ name: "Duration", value: durationStr, inline: true }];
    const errLines = stderrBuf
      .split("\n")
      .filter((l) => /error|failed/i.test(l))
      .slice(0, 3)
      .join("\n");
    if (errLines) {
      fields.push({
        name: "Error",
        value: "```\n" + errLines.slice(0, 900) + "\n```",
        inline: false,
      });
    }
    await notifyDiscord("❌ 배포 실패", COLORS.error, fields);
    process.exit(code ?? 1);
  }
});
