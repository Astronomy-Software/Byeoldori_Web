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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUp } from "@/lib/api/auth";
import { toast } from "sonner";
import { Star } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    name: "",
    consentTerms: false,
    consentPrivacy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!form.consentTerms || !form.consentPrivacy) {
      setError("이용약관과 개인정보처리방침에 동의해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        email: form.email,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        nickname: form.nickname,
        name: form.name,
        consentTerms: form.consentTerms,
        consentPrivacy: form.consentPrivacy,
      });
      toast.success("회원가입 완료! 이메일 인증을 진행해주세요.");
      router.push("/login");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "회원가입에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
          <Star className="h-6 w-6 text-purple-400" />
        </div>
        <CardTitle className="text-xl">회원가입</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              value={form.nickname}
              onChange={(e) => updateField("nickname", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => updateField("passwordConfirm", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.consentTerms}
                onChange={(e) => updateField("consentTerms", e.target.checked)}
                className="accent-purple-500"
              />
              이용약관에 동의합니다 (필수)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.consentPrivacy}
                onChange={(e) =>
                  updateField("consentPrivacy", e.target.checked)
                }
                className="accent-purple-500"
              />
              개인정보처리방침에 동의합니다 (필수)
            </label>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "가입 중..." : "회원가입"}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300"
            >
              로그인
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
