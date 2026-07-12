"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPostDetail, updatePost } from "@/lib/api/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditPostPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const postId = Number(params.id);
  const type = params.type.toUpperCase();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPostDetail(postId)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setImageUrls(post.images ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("게시글을 불러오지 못했습니다.");
        router.back();
      });
  }, [postId, router]);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await updatePost(postId, { title, content, imageUrls });
      toast.success("게시글이 수정되었습니다.");
      router.push(`/community/${params.type}/${postId}`);
    } catch {
      toast.error("수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  const typeLabel =
    type === "REVIEW" ? "관측 리뷰" : type === "EDUCATION" ? "교육 프로그램" : "자유게시판";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-interactive-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-bg-page p-4 md:p-6">
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">
        {typeLabel} 수정
      </h1>

      <div className="glass space-y-5 rounded-2xl p-5 md:p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">제목</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">내용</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            className="min-h-[300px] border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="glow-primary w-full bg-interactive-primary text-white hover:bg-interactive-primary/90"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
