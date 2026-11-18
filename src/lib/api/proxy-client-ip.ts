// 백엔드 레이트리밋이 웹 사용자를 IP별로 세도록 실제 사용자 IP를 넘기는 헤더.
// 프록시를 거치면 백엔드는 Worker IP만 보므로, 공유 비밀과 함께 보낸 경우에만 서버가 이 IP를 믿는다
// (서버 ClientIpResolver, app.proxy.shared-secret).
export const PROXY_SECRET_HEADER = "x-byeoldori-proxy-secret";
export const CLIENT_IP_HEADER = "x-byeoldori-client-ip";

/**
 * 백엔드로 보낼 헤더에 사용자 IP와 공유 비밀을 넣는다.
 * IP는 Cloudflare가 직접 채우는 CF-Connecting-IP만 쓴다(브라우저가 위조할 수 없음).
 * 비밀이 없거나 IP를 모르면 아무것도 넣지 않는다(예전 동작 그대로).
 */
export function applyProxyClientIp(
  outgoing: Headers,
  incoming: Headers,
  secret: string | undefined,
): void {
  // 브라우저가 보낸 같은 이름의 헤더는 절대 그대로 넘기지 않는다
  outgoing.delete(PROXY_SECRET_HEADER);
  outgoing.delete(CLIENT_IP_HEADER);

  const trimmedSecret = secret?.trim();
  const clientIp = incoming.get("cf-connecting-ip")?.trim();
  if (!trimmedSecret || !clientIp) return;

  outgoing.set(PROXY_SECRET_HEADER, trimmedSecret);
  outgoing.set(CLIENT_IP_HEADER, clientIp);
}
