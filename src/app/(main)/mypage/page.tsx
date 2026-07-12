"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { updateMe, uploadProfileImage, logOut } from "@/lib/api/user";
import { getObservationCount } from "@/lib/api/calendar";
import type { ObservationCountDto } from "@/types/api";
import { toast } from "sonner";
import {
  Calendar,
  Heart,
  Settings,
  LogOut,
  Camera,
  ChevronRight,
} from "lucide-react";

export default function MyPageScreen() {
  const router = useRouter();
  const { user, loadUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [observationCount, setObservationCount] =
    useState<ObservationCountDto | null>(null);
  const [observationError, setObservationError] = useState(false);

  useEffect(() => {
    loadUser();
    setObservationError(false);
    getObservationCount()
      .then((r) => setObservationCount(r))
      .catch(() => setObservationError(true));
  }, [loadUser]);

  useEffect(() => {
    if (user) setNickname(user.nickname ?? "");
  }, [user]);

  async function handleUpdateProfile() {
    try {
      await updateMe({ nickname });
      await loadUser();
      setIsEditing(false);
      toast.success("프로필이 수정되었습니다.");
    } catch {
      toast.error("프로필 수정에 실패했습니다.");
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadProfileImage(file);
      await loadUser();
      toast.success("프로필 이미지가 변경되었습니다.");
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    }
  }

  async function handleLogout() {
    try {
      await logOut();
    } catch {
      // ignore
    }
    logout();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="starfield flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-interactive-primary border-t-transparent" />
      </div>
    );
  }


  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary">마이페이지</h1>

        {/* 프로필 히어로 */}
        <Card className="glass rounded-2xl border-border-default">
          <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-1 ring-border-strong">
                <AvatarImage src={user.profileImageUrl ?? undefined} />
                <AvatarFallback className="bg-interactive-primary text-2xl text-text-on-primary">
                  {(user.nickname ?? user.name)[0]}
                </AvatarFallback>
              </Avatar>
              <label className="glow-primary absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-interactive-primary p-1.5">
                <Camera className="h-3.5 w-3.5 text-text-on-primary" aria-hidden="true" />
                <span className="sr-only">프로필 이미지 변경</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  aria-label="프로필 이미지 변경"
                />
              </label>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-text-tertiary">닉네임</Label>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="h-9 border-border-default bg-surface-1 text-text-primary"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="bg-interactive-primary text-text-on-primary hover:bg-interactive-primary/90"
                    onClick={handleUpdateProfile}
                  >
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-text-secondary hover:text-text-primary"
                    onClick={() => setIsEditing(false)}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-bold text-text-primary">
                      {user.nickname ?? user.name}
                    </p>
                    <Badge className="border-transparent bg-aurora/15 font-mono text-aurora">
                      별지기
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-tertiary">{user.email}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-xs text-interactive-link transition-colors hover:text-aurora"
                  >
                    프로필 수정
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 관측 스탯 블록 */}
        {observationError && (
          <p role="alert" className="text-sm text-error">
            관측 통계를 불러오지 못했습니다.
          </p>
        )}
        {observationCount && (
          <Card className="rounded-2xl border-border-default bg-surface-1">
            <CardHeader className="flex flex-row items-center gap-1.5 pb-1">
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
              <CardTitle className="text-xs font-medium text-text-tertiary">
                관측 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-3xl font-bold text-aurora">
                {observationCount.observationCount}
                <span className="ml-1 text-base font-normal text-text-tertiary">
                  회
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        <Separator className="bg-border-default" />

        {/* 바로가기 (내 활동) */}
        <div className="space-y-2">
          <MenuLink href="/mypage/schedule" icon={Calendar} label="관측 일정 관리" />
          <MenuLink href="/mypage/likes" icon={Heart} label="좋아요한 글" />
          <MenuLink href="/mypage/settings" icon={Settings} label="설정" />
        </div>

        <Separator className="bg-border-default" />

        <Button
          variant="ghost"
          className="w-full justify-start text-error hover:bg-error/10 hover:text-error"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> 로그아웃
        </Button>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-border-default bg-surface-1 p-4 text-sm text-text-primary transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-interactive-link">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
    </Link>
  );
}
