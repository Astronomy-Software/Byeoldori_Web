"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { resign } from "@/lib/api/user";
import { toast } from "sonner";
import { ArrowLeft, UserCircle, Info, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  async function handleResign() {
    if (
      !confirm(
        "정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    )
      return;

    try {
      await resign();
      await logout();
      router.replace("/login");
    } catch {
      toast.error("회원 탈퇴에 실패했습니다.");
    }
  }

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <h1 className="mb-6 text-2xl font-bold text-text-primary">설정</h1>

        <div className="space-y-4">
          {/* 계정 — 연동된 소셜 계정 */}
          <section className="glass rounded-2xl border-border-default p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-interactive-link" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-text-primary">계정</h2>
            </div>
            <p className="text-xs text-text-tertiary">
              소셜 계정으로 로그인 중입니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border-border-default bg-surface-2 font-medium text-text-secondary">
                구글
              </Badge>
              <Badge className="border-border-default bg-surface-2 font-medium text-text-secondary">
                카카오
              </Badge>
              <Badge className="border-border-default bg-surface-2 font-medium text-text-secondary">
                네이버
              </Badge>
            </div>
          </section>

          {/* 앱 정보 */}
          <section className="rounded-2xl border border-border-default bg-surface-1 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-interactive-link" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-text-primary">앱 정보</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">버전</dt>
                <dd className="font-mono text-text-secondary">v1.0.0</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">서비스 이용약관</dt>
                <dd className="text-text-secondary">별도리</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-tertiary">개인정보 처리방침</dt>
                <dd className="text-text-secondary">별도리</dd>
              </div>
            </dl>
          </section>

          <Separator className="bg-border-default" />

          {/* 위험 영역 */}
          <section className="rounded-2xl border border-error/30 bg-error/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-error" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-error">위험 영역</h2>
            </div>
            <Button
              variant="outline"
              className="border-error/50 text-error hover:bg-error/10"
              onClick={handleResign}
            >
              회원 탈퇴
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
