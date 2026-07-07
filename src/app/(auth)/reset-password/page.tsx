"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetPasswordToEmail } from "@/lib/api/auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPasswordToEmail({ email });
      setSent(true);
      toast.success("비밀번호 재설정 이메일을 발송했습니다.");
    } catch {
      toast.error("이메일 발송에 실패했습니다. 이메일을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">비밀번호 찾기</CardTitle>
      </CardHeader>
      {sent ? (
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
            <br />
            이메일을 확인해주세요.
          </p>
          <Link href="/login">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              로그인으로 돌아가기
            </Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">가입한 이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "발송 중..." : "비밀번호 재설정 메일 발송"}
            </Button>
            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              로그인으로 돌아가기
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
