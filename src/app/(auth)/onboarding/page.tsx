"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateMe } from "@/lib/api/user";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const loadUser = useAuthStore((s) => s.loadUser);
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;

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

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
          <Star className="h-8 w-8 text-purple-400" />
        </div>
        <CardTitle className="text-2xl text-foreground">별도리에 오신 것을 환영합니다!</CardTitle>
        <CardDescription>커뮤니티에서 사용할 닉네임을 설정해주세요.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              required
            />
            <p className="text-xs text-muted-foreground">
              나중에 마이페이지에서 변경할 수 있습니다.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? "저장 중..." : "시작하기"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSkip}
          >
            나중에 설정하기
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
