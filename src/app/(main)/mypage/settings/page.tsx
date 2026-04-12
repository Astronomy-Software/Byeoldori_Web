"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { resign } from "@/lib/api/user";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

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
      logout();
      toast.success("회원 탈퇴가 완료되었습니다.");
      router.replace("/login");
    } catch {
      toast.error("회원 탈퇴에 실패했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>
      <h1 className="mb-4 text-xl font-bold text-foreground">설정</h1>

      <div className="space-y-4">
        <div className="rounded-lg bg-card/50 p-4">
          <h2 className="text-sm font-semibold text-foreground">앱 정보</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            별도리 웹 v1.0.0
          </p>
        </div>

        <Separator className="bg-border" />

        <div className="rounded-lg bg-card/50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-error">위험 영역</h2>
          <Button
            variant="outline"
            className="border-error/50 text-error hover:bg-error/10"
            onClick={handleResign}
          >
            회원 탈퇴
          </Button>
        </div>
      </div>
    </div>
  );
}
