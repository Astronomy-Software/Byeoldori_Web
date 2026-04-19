import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

// Edge 불가 (node:crypto 사용). 기본 Node.js 런타임에서 실행.
export const runtime = "nodejs";

const DISCORD_COLOR = {
  started: 0x5865f2, // 파랑
  success: 0x57f287, // 초록
  error: 0xed4245, // 빨강
} as const;

type VercelWebhookEvent = {
  id: string;
  type: string;
  createdAt: number;
  payload: {
    deployment?: {
      id: string;
      url: string;
      name?: string;
      meta?: {
        githubCommitMessage?: string;
        githubCommitSha?: string;
        githubCommitAuthorName?: string;
        githubCommitRef?: string;
      };
      inspectorUrl?: string;
    };
    project?: { id: string; name: string };
    target?: "production" | "staging" | null;
    user?: { id: string; username?: string };
    links?: { deployment?: string; project?: string };
  };
};

type DiscordEmbed = {
  title: string;
  description?: string;
  url?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp: string;
  footer?: { text: string };
};

export async function POST(req: NextRequest) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!secret || !discordUrl) {
    return new Response("Webhook config missing", { status: 500 });
  }

  // 서명 검증에 쓸 수 있도록 body 원문 확보
  const body = await req.text();
  const signature = req.headers.get("x-vercel-signature");

  if (!signature || !verifySignature(body, signature, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: VercelWebhookEvent;
  try {
    event = JSON.parse(body) as VercelWebhookEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const embed = buildEmbed(event);
  if (!embed) {
    // 모르는 이벤트는 조용히 무시 — Vercel 재시도 방지 위해 200
    return new Response("ignored", { status: 200 });
  }

  try {
    await fetch(discordUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (e) {
    console.warn("Discord webhook POST 실패:", e);
  }

  return new Response("ok", { status: 200 });
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha1", secret).update(body).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function buildEmbed(event: VercelWebhookEvent): DiscordEmbed | null {
  const d = event.payload.deployment;
  const target = event.payload.target ?? "preview";
  const commitMsg = d?.meta?.githubCommitMessage?.split("\n")[0] ?? "(no commit message)";
  const commitSha = d?.meta?.githubCommitSha?.slice(0, 7);
  const author = d?.meta?.githubCommitAuthorName ?? event.payload.user?.username ?? "unknown";
  const deployUrl = d?.url ? `https://${d.url}` : undefined;
  const timestamp = new Date(event.createdAt).toISOString();

  const commitField = {
    name: "Commit",
    value: commitSha ? `\`${commitSha}\` ${commitMsg}` : commitMsg,
    inline: false,
  };
  const authorField = { name: "Author", value: author, inline: true };
  const envField = { name: "Environment", value: String(target), inline: true };

  switch (event.type) {
    case "deployment.created":
      return {
        title: "🚀 배포 시작",
        description: "Byeoldori Web 배포가 시작되었습니다.",
        url: deployUrl,
        color: DISCORD_COLOR.started,
        fields: [envField, authorField, commitField],
        timestamp,
        footer: { text: "byeoldori-web" },
      };

    case "deployment.succeeded":
      return {
        title: "✅ 배포 완료",
        description: "배포가 성공적으로 완료되었습니다.",
        url: deployUrl,
        color: DISCORD_COLOR.success,
        fields: [
          envField,
          authorField,
          commitField,
          ...(deployUrl ? [{ name: "URL", value: deployUrl, inline: false }] : []),
        ],
        timestamp,
        footer: { text: "byeoldori-web" },
      };

    case "deployment.error":
      return {
        title: "❌ 배포 실패",
        description: "빌드 또는 배포 중 에러가 발생했습니다.",
        url: d?.inspectorUrl,
        color: DISCORD_COLOR.error,
        fields: [
          envField,
          authorField,
          commitField,
          ...(d?.inspectorUrl
            ? [{ name: "Inspector", value: d.inspectorUrl, inline: false }]
            : []),
        ],
        timestamp,
        footer: { text: "byeoldori-web" },
      };

    default:
      return null;
  }
}
