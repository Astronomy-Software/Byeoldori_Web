"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { getPostDetail, updatePost } from "@/lib/api/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { editorStateHasContent } from "@/lib/community/content-text";
import { COMMUNITY_TAB_LABELS, routeTypeToTab } from "@/lib/community/board-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// 리치 텍스트 에디터는 브라우저 전용(SSR 비활성).
const LexicalEditor = dynamic(
  () => import("@/components/editor/lexical-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[300px] rounded-lg border border-border-default bg-surface-1 p-3 text-sm text-text-tertiary">
        에디터 로딩 중...
      </div>
    ),
  },
);

export default function EditPostPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const postId = Number(params.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // 본문 에디터 안의 이미지 업로드 진행 여부 — 끝나기 전에 저장하면 이미지가 빠진다.
  const [editorUploading, setEditorUploading] = useState(false);

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
    if (editorUploading) {
      toast.error("이미지 업로드가 끝난 뒤 다시 시도해주세요.");
      return;
    }
    if (!title.trim() || !editorStateHasContent(content)) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await updatePost(postId, { title, content, imageUrls });
      toast.success("게시글이 수정되었습니다.");
      // replace: 기록에 수정 화면이 남으면 '돌아가기'·삭제 후 이동이 수정 화면으로 간다.
      router.replace(`/community/${params.type}/${postId}`);
    } catch {
      toast.error("수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  // 라우트 세그먼트는 소문자 review|program|free — 서버 enum(EDUCATION)과 비교하면 안 된다.
  const typeLabel = COMMUNITY_TAB_LABELS[routeTypeToTab(params.type)];

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
          <label htmlFor="edit-title" className="mb-1.5 block text-sm font-medium text-text-secondary">제목</label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">내용</label>
          <LexicalEditor
            value={content}
            onChange={setContent}
            onUploadingChange={setEditorUploading}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || editorUploading}
          className="glow-primary w-full bg-interactive-primary text-white hover:bg-interactive-primary/90"
        >
          {isSaving ? "저장 중..." : editorUploading ? "이미지 업로드 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
