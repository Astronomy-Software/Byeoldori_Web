#!/usr/bin/env bash
# Stellarium Web 통합 관리 스크립트
#
# 역할: public/stellarium/ 의 빌드 결과물에 우리 커스터마이징을 재적용한다.
#   1) <base href="/stellarium/">          — 자산 경로 보정
#   2) history.replaceState('/')            — Vue Router(history mode) 경로 리셋
#   3) stellarium-web-engine.wasm 복사      — unhashed 참조 호환
#
# 이 스크립트는 "Vue 프론트 + 엔진" 전체 재빌드를 하지 않는다.
# 엔진 재컴파일은 Emscripten이 필요하므로 Docker 경유(vendor 경로의 Makefile 참조).
# 일반적으로는 upstream에서 새 빌드 결과물을 받아 public/stellarium/ 에 덮어쓴 뒤
# 이 스크립트를 실행해서 커스터마이징만 재적용하면 된다.

set -euo pipefail

cd "$(dirname "$0")/.."
DST="public/stellarium"
INDEX="$DST/index.html"

if [ ! -f "$INDEX" ]; then
  echo "❌ $INDEX 가 없다. 먼저 빌드된 Stellarium Web 에셋을 $DST/ 에 배치하라." >&2
  echo "   (Docker 빌드: cd vendor/stellarium-web-engine && make -C apps/web-frontend build)" >&2
  exit 1
fi

echo "🌌 Stellarium 커스터마이징 재적용"
echo "   target: $INDEX"

# ─────────────────────────────────────────────
# 1) <base href> 삽입 (없으면 추가)
# ─────────────────────────────────────────────
if ! grep -q '<base href="/stellarium/"' "$INDEX"; then
  # <head> 바로 뒤(열린 head 태그 다음)에 base 태그 주입
  sed -i 's#<head>#<head><base href="/stellarium/">#' "$INDEX"
  echo "   + <base href=\"/stellarium/\"> 삽입"
else
  echo "   = <base href> 이미 존재"
fi

# ─────────────────────────────────────────────
# 2) history.replaceState 스크립트 삽입 (없으면 추가)
# ─────────────────────────────────────────────
if ! grep -q "history.replaceState(null, '', '/')" "$INDEX"; then
  sed -i "s#<base href=\"/stellarium/\">#<base href=\"/stellarium/\"><script>history.replaceState(null, '', '/');</script>#" "$INDEX"
  echo "   + history.replaceState 스크립트 삽입"
else
  echo "   = history.replaceState 이미 존재"
fi

# ─────────────────────────────────────────────
# 3) WASM 파일명 호환 (hashed → unhashed 사본)
# ─────────────────────────────────────────────
if [ -d "$DST/js" ]; then
  WASM_HASHED="$(find "$DST/js" -maxdepth 1 -name 'stellarium-web-engine.*.wasm' ! -name 'stellarium-web-engine.wasm' | head -1 || true)"
  if [ -n "$WASM_HASHED" ] && [ ! -f "$DST/js/stellarium-web-engine.wasm" ]; then
    cp "$WASM_HASHED" "$DST/js/stellarium-web-engine.wasm"
    echo "   + unhashed WASM 사본: $(basename "$WASM_HASHED") → stellarium-web-engine.wasm"
  else
    echo "   = WASM 사본 이미 존재 또는 불필요"
  fi
fi

echo "✅ 완료"
