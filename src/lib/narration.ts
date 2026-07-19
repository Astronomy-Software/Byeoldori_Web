"use client";

// 교육 나레이션 — Web Speech API(무료, ko-KR). 자막은 항상 표시되고,
// 음성은 여기서 재생한다. 고품질 사전녹음 TTS는 추후 고도화 항목(이 모듈 교체).

const PREF_KEY = "byeoldori_narration_enabled";

function hasSpeech(): boolean {
  return (
    typeof window !== "undefined" && "speechSynthesis" in window
  );
}

/** 한국어 음성 우선 선택(로드 지연 대응) */
function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (!hasSpeech()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => v.lang === "ko-KR") ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("ko")) ??
    null
  );
}

export function isNarrationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PREF_KEY) !== "off";
}

export function setNarrationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  if (!enabled) cancelNarration();
}

/** 진행 중 나레이션 중단 (스텝 전환·종료 시) */
export function cancelNarration(): void {
  if (hasSpeech()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // no-op
    }
  }
}

/** 대사 음성 재생 — 이전 발화는 취소하고 새로 말한다 */
export function speak(text: string): void {
  if (!hasSpeech() || !isNarrationEnabled()) return;
  const clean = (text ?? "").trim();
  if (!clean) return;

  try {
    window.speechSynthesis.cancel(); // 중복/겹침 방지
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "ko-KR";
    utter.rate = 0.96; // 해설 톤: 살짝 느리게
    utter.pitch = 1.05;
    const voice = pickKoreanVoice();
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  } catch {
    // 음성 실패해도 자막으로 충분히 진행됨
  }
}

/** 브라우저가 음성 목록을 늦게 로드하는 경우 미리 워밍 */
export function warmupVoices(): void {
  if (!hasSpeech()) return;
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  } catch {
    // no-op
  }
}
