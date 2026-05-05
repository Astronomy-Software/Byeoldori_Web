"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { resign, changePassword } from "@/lib/api/user";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isPwLoading, setIsPwLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsPwLoading(true);
    try {
      await changePassword(pwForm);
      toast.success("비밀번호가 변경되었습니다.");
      setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch {
      toast.error("비밀번호 변경에 실패했습니다.");
    } finally {
      setIsPwLoading(false);
    }
  }

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

        {/* 비밀번호 변경 — PATCH /users/password-change */}
        <div className="rounded-lg bg-card/50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">비밀번호 변경</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <Label htmlFor="currentPassword" className="text-xs">현재 비밀번호</Label>
              <Input
                id="currentPassword"
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-xs">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword" className="text-xs">새 비밀번호 확인</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={pwForm.confirmNewPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isPwLoading}
            >
              {isPwLoading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
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
