"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Camera,
} from "lucide-react";

export default function MyPageScreen() {
  const router = useRouter();
  const { user, loadUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [observationCount, setObservationCount] =
    useState<ObservationCountDto | null>(null);

  useEffect(() => {
    loadUser();
    getObservationCount()
      .then((r) => setObservationCount(r))
      .catch(() => {});
  }, [loadUser]);

  useEffect(() => {
    if (user) setNickname(user.nickname);
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-xl font-bold text-foreground">마이페이지</h1>

      {/* 프로필 카드 */}
      <Card className="border-purple-700/30 bg-card/80">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profileImageUrl ?? undefined} />
              <AvatarFallback className="bg-purple-600 text-lg">
                {user.nickname[0]}
              </AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-purple-600 p-1">
              <Camera className="h-3 w-3 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">닉네임</Label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-8"
                  />
                </div>
                <Button size="sm" onClick={handleUpdateProfile}>
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  취소
                </Button>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold text-foreground">
                  {user.nickname}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-1 text-xs text-purple-400 hover:text-purple-300"
                >
                  프로필 수정
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 관측 통계 */}
      {observationCount && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-purple-700/30 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                전체 관측 계획
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {observationCount.total}
              </p>
            </CardContent>
          </Card>
          <Card className="border-purple-700/30 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                완료한 관측
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                {observationCount.completed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator className="bg-border" />

      {/* 메뉴 목록 */}
      <div className="space-y-2">
        <MenuLink href="/mypage/schedule" icon={Calendar} label="관측 일정 관리" />
        <MenuLink href="/mypage/likes" icon={Heart} label="좋아요한 글" />
        <MenuLink href="/mypage/settings" icon={Settings} label="설정" />
      </div>

      <Separator className="bg-border" />

      <Button
        variant="ghost"
        className="w-full justify-start text-error hover:text-error"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" /> 로그아웃
      </Button>
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
      className="flex items-center gap-3 rounded-lg p-3 text-sm text-foreground transition-colors hover:bg-card/50"
    >
      <Icon className="h-4 w-4 text-purple-400" />
      {label}
    </Link>
  );
}
