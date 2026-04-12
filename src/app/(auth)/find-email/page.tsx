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
import { findEmail } from "@/lib/api/auth";

export default function FindEmailPage() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const res = await findEmail({ name });
      setResult(res.email);
    } catch {
      setError("일치하는 이메일을 찾을 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">이메일 찾기</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="가입 시 입력한 이름"
              required
            />
          </div>
          {result && (
            <p className="rounded-md bg-purple-500/10 p-3 text-sm text-success">
              찾은 이메일: <strong>{result}</strong>
            </p>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "검색 중..." : "이메일 찾기"}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
