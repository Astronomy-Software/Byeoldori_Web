"use client";

import { usePathname } from "next/navigation";
import { Live2DCharacter } from "@/components/live2d-character";

/**
 * 화면 우하단에 상시 떠 있는 전역 마스코트.
 *
 * 별도리를 스스로 배치·제어하는 화면(교육 프로그램 저작 등)에서는 렌더하지 않는다.
 * 함께 그리면 캐릭터가 두 개가 되고, 전역 쪽은 fixed 라서 그 화면의 UI를 가린다.
 * (실제로 저작 화면에서 '현재 장면 캡처' 버튼을 덮는 문제가 있었다)
 * Live2D 캔버스가 둘이면 WebGL 컨텍스트와 모델 로딩도 이중이라 낭비이기도 하다.
 */
const ROUTES_WITH_OWN_CHARACTER = ["/community/program/author"];

export function GlobalMascot() {
  const pathname = usePathname();
  const hasOwn = ROUTES_WITH_OWN_CHARACTER.some((r) => pathname?.startsWith(r));
  if (hasOwn) return null;
  return <Live2DCharacter />;
}
