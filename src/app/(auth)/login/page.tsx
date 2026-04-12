"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useAuthStore } from "@/stores/auth-store";
import { Star } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login({ email, password });
      router.replace("/home");
    } catch {
      // error는 store에서 관리
    }
  }

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
          <Star className="h-8 w-8 text-purple-400" />
        </div>
        <CardTitle className="text-2xl text-foreground">별도리</CardTitle>
        <CardDescription>천체 관측 교육 플랫폼에 로그인하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
          <div className="flex w-full justify-between text-sm">
            <Link
              href="/find-email"
              className="text-muted-foreground hover:text-foreground"
            >
              이메일 찾기
            </Link>
            <Link
              href="/reset-password"
              className="text-muted-foreground hover:text-foreground"
            >
              비밀번호 찾기
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300">
              회원가입
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
