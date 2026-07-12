"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Live2DCharacter } from "@/components/live2d-character";
import { updateMe } from "@/lib/api/user";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const INTERESTS = [
  "달·행성",
  "성운·은하",
  "별자리",
  "유성우",
  "은하수",
  "일출·일몰",
  "딥스카이",
  "천체사진",
];

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const loadUser = useAuthStore((s) => s.loadUser);

  // 스텝 상태 (0: 환영, 1: 관심사, 2: 지역, 3: 완료)
  const [step, setStep] = useState(0);

  // 기존 백엔드 계약(닉네임) — 실제 제출 페이로드
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // UI 전용 로컬 state (제출 페이로드 변경 없음, 백엔드 계약 유지)
  const [interests, setInterests] = useState<string[]>([]);
  const [region, setRegion] = useState<string | null>(null);

  // 온보딩 완료: 기존 제출/라우팅 로직 그대로 실행
  async function completeOnboarding() {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.");
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      await updateMe({ nickname: nickname.trim() });
      await loadUser();
      router.replace("/home");
    } catch {
      toast.error("닉네임 설정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSkip() {
    router.replace("/home");
  }

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  }

  const canProceedInterests = nickname.trim().length > 0;

  return (
    <div className="relative flex min-h-[36rem] w-full max-w-md flex-col items-center">
      {/* 건너뛰기 */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute right-0 top-0 z-10 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
      >
        건너뛰기
      </button>

      <div className="glass w-full rounded-2xl border border-border-default p-6 sm:p-8">
        {/* ─────────── 스텝 0: 환영 ─────────── */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center">
            <div className="glass mb-6 max-w-xs rounded-2xl border border-border-default px-5 py-3">
              <p className="text-sm leading-relaxed text-text-primary">
                안녕하세요! 저는 <span className="text-aurora">별도리</span>예요 ✦ 오늘 밤 별
                보는 걸 도와드릴게요!
              </p>
            </div>

            <Live2DCharacter
              className="pointer-events-none mx-auto h-72 w-72"
              scale={1.3}
            />

            <Button
              type="button"
              onClick={() => setStep(1)}
              className="glow-primary mt-6 w-full rounded-2xl bg-interactive-primary text-text-on-primary hover:opacity-90"
            >
              시작하기
            </Button>
          </div>
        )}

        {/* ─────────── 스텝 1: 관심사 ─────────── */}
        {step === 1 && (
          <div className="flex flex-col">
            <div className="mb-4 flex items-start gap-3">
              <Live2DCharacter
              className="pointer-events-none h-28 w-28 shrink-0"
              scale={1.2}
            />
              <div className="glass rounded-2xl border border-border-default px-4 py-3">
                <p className="text-sm text-text-primary">어떤 하늘을 좋아하세요?</p>
              </div>
            </div>

            <div className="mb-5 space-y-2">
              <Label htmlFor="nickname" className="text-text-secondary">
                별도리에서 사용할 닉네임
              </Label>
              <Input
                id="nickname"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="rounded-2xl"
                required
              />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INTERESTS.map((item) => {
                const selected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`rounded-2xl px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "bg-interactive-primary text-text-on-primary"
                        : "bg-surface-2 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <StepNav
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              nextDisabled={!canProceedInterests}
            />
          </div>
        )}

        {/* ─────────── 스텝 2: 관측 지역 ─────────── */}
        {step === 2 && (
          <div className="flex flex-col">
            <div className="mb-4 flex items-start gap-3">
              <Live2DCharacter
              className="pointer-events-none h-28 w-28 shrink-0"
              scale={1.2}
            />
              <div className="glass rounded-2xl border border-border-default px-4 py-3">
                <p className="text-sm text-text-primary">어디서 주로 별을 보세요?</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRegion("현재 위치")}
              className={`mb-4 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors ${
                region === "현재 위치"
                  ? "bg-interactive-primary text-text-on-primary"
                  : "bg-surface-2 text-text-secondary hover:text-text-primary"
              }`}
            >
              <MapPin className="h-4 w-4" />
              현재 위치 사용
            </button>

            <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {REGIONS.map((item) => {
                const selected = region === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRegion(item)}
                    className={`rounded-2xl px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "bg-interactive-primary text-text-on-primary"
                        : "bg-surface-2 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* ─────────── 스텝 3: 완료 ─────────── */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center">
            <div className="glass mb-6 max-w-xs rounded-2xl border border-border-default px-5 py-3">
              <p className="text-sm leading-relaxed text-text-primary">
                준비 끝! <span className="text-aurora">✦</span> 오늘 밤 별 보러 가요
              </p>
            </div>

            <Live2DCharacter
              className="pointer-events-none mx-auto h-72 w-72"
              scale={1.3}
            />

            {/* 선택 요약 */}
            <div className="mt-6 w-full space-y-3 text-left">
              {interests.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-text-tertiary">관심사</p>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((item) => (
                      <span
                        key={item}
                        className="rounded-2xl bg-surface-2 px-3 py-1 text-xs text-text-secondary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {region && (
                <div>
                  <p className="mb-2 text-xs text-text-tertiary">관측 지역</p>
                  <span className="inline-flex rounded-2xl bg-surface-2 px-3 py-1 text-xs text-text-secondary">
                    {region}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={completeOnboarding}
              disabled={isLoading}
              className="glow-primary mt-6 w-full rounded-2xl bg-interactive-primary text-text-on-primary hover:opacity-90"
            >
              {isLoading ? "저장 중..." : "별도리 시작하기"}
            </Button>
          </div>
        )}
      </div>

      {/* 진행점 4개 */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === step ? "bg-interactive-primary" : "bg-surface-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="flex-1 rounded-2xl text-text-secondary"
      >
        이전
      </Button>
      <Button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="glow-primary flex-1 rounded-2xl bg-interactive-primary text-text-on-primary hover:opacity-90"
      >
        다음
      </Button>
    </div>
  );
}
