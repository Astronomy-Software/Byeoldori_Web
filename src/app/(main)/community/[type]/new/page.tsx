"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFreePost,
  createReviewPost,
  createEducationPost,
} from "@/lib/api/community";
import { uploadImage } from "@/lib/api/files";
import { getSitesByKeyword } from "@/lib/api/observation-sites";
import { findSiteByExactName } from "@/lib/community/review-site";
import type { ObservationSite } from "@/types/api";
import { editorStateHasContent } from "@/lib/community/content-text";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Star, Clapperboard } from "lucide-react";

// 리치 텍스트 에디터는 브라우저 전용(SSR 비활성).
const LexicalEditor = dynamic(
  () => import("@/components/editor/lexical-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[220px] rounded-lg border border-border-default bg-surface-1 p-3 text-sm text-text-tertiary">
        에디터 로딩 중...
      </div>
    ),
  },
);

function NewPostInner() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = params.type;
  // 저작 화면(/community/program/author)에서 넘겨준 교육 프로그램 id
  const programId = searchParams.get("programId") ?? undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteSuggestions, setSiteSuggestions] = useState<ObservationSite[]>([]);
  const [rating, setRating] = useState(5);
  const [objectName, setObjectName] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // 본문 에디터 안(툴바·붙여넣기·드롭)의 이미지 업로드 진행 여부
  const [editorUploading, setEditorUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadInProgress = isUploading || editorUploading;

  const typeLabel =
    type === "review"
      ? "관측 리뷰"
      : type === "program"
        ? "교육 프로그램"
        : "자유게시판";

  // 관측지 이름 자동완성(등록된 관측지). 고르면 리뷰가 그 관측지에 연결된다.
  useEffect(() => {
    if (type !== "review") return;
    const q = siteName.trim();
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!q) {
        setSiteSuggestions([]);
        return;
      }
      getSitesByKeyword(q)
        .then((sites) => {
          if (!cancelled) setSiteSuggestions(sites.slice(0, 10));
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [siteName, type]);

  async function resolveObservationSiteId(name: string) {
    const fromSuggestions = findSiteByExactName(siteSuggestions, name);
    if (fromSuggestions) return fromSuggestions.id;
    try {
      return findSiteByExactName(await getSitesByKeyword(name.trim()), name)?.id;
    } catch {
      return undefined; // 연결 실패는 글 작성을 막지 않는다(이름만 저장)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await uploadImage(file);
        setImageUrls((prev) => [...prev, res.url]);
      }
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 업로드 중에 저장하면 올리던 이미지가 빠진 채 저장되고 화면이 떠난다.
    if (uploadInProgress) {
      toast.error("이미지 업로드가 끝난 뒤 다시 시도해주세요.");
      return;
    }
    if (!editorStateHasContent(content)) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      let postId: number;
      if (type === "review") {
        const observationSiteId = await resolveObservationSiteId(siteName);
        const res = await createReviewPost({
          title,
          content,
          siteName,
          rating,
          imageUrls,
          observationSiteId,
        });
        postId = res.id;
      } else if (type === "program") {
        const res = await createEducationPost({
          title,
          content,
          objectName,
          difficulty,
          imageUrls,
          programId,
        });
        postId = res.id;
      } else {
        const res = await createFreePost({ title, content, imageUrls });
        postId = res.id;
      }
      toast.success("게시글이 작성되었습니다.");
      router.replace(`/community/${type}/${postId}`);
    } catch {
      toast.error("게시글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-bg-page p-4 md:p-6">
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      <h1 className="mb-5 text-2xl font-bold tracking-tight text-text-primary">
        {typeLabel} 글쓰기
      </h1>

      <form onSubmit={handleSubmit} className="glass space-y-5 rounded-2xl p-5 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-text-secondary">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
        </div>

        {type === "review" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-text-secondary">관측지 이름</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                list="site-suggestions"
                autoComplete="off"
                aria-describedby="siteName-help"
                className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
              />
              <datalist id="site-suggestions">
                {siteSuggestions.map((site) => (
                  <option key={site.id} value={site.name} />
                ))}
              </datalist>
              <p id="siteName-help" className="text-xs text-text-tertiary">
                목록의 관측지를 고르면 관측지 페이지에 리뷰가 함께 표시됩니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating" className="text-text-secondary">평점 (1~5)</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    aria-label={`${i + 1}점`}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${i < rating ? "fill-aurora text-aurora" : "text-text-tertiary"}`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-sm text-text-secondary">{rating}/5</span>
              </div>
            </div>
          </>
        )}

        {type === "program" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="objectName" className="text-text-secondary">천체 이름</Label>
              <Input
                id="objectName"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                required
                className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-text-secondary">난이도</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-border-default bg-surface-1 px-3 py-2 text-sm text-text-primary"
              >
                <option value="BEGINNER">초급</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
              </select>
            </div>

            {/* 별지도 저작(감독모드) 연동 */}
            <div className="space-y-2 rounded-xl border border-border-default bg-surface-1 p-3">
              {programId ? (
                <p className="text-sm text-text-secondary">
                  연결된 프로그램:{" "}
                  <span className="font-mono text-aurora">{programId}</span>
                </p>
              ) : (
                <p className="text-sm text-text-tertiary">
                  별지도에서 장면·나레이션을 직접 구성한 교육 프로그램을 붙일 수 있습니다.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  // 저작 화면으로 이동하면 이 폼(제목·본문)은 언마운트되어 사라진다.
                  // 작성 중인 내용이 있으면 유실 전에 확인받는다.
                  const hasDraft =
                    title.trim().length > 0 || editorStateHasContent(content);
                  if (
                    hasDraft &&
                    !window.confirm(
                      "작성 중인 제목·내용이 저장되지 않고 사라집니다. 프로그램 제작 화면으로 이동할까요?",
                    )
                  ) {
                    return;
                  }
                  // 연결된 프로그램이 있으면 그 프로그램을 다시 열어 고친다(새 프로그램을 만들지 않는다).
                  router.push(
                    programId
                      ? `/community/program/author?id=${encodeURIComponent(programId)}`
                      : "/community/program/author",
                  );
                }}
                className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary transition-colors hover:border-interactive-primary"
              >
                <Clapperboard className="h-4 w-4" />
                {programId ? "프로그램 다시 제작하기" : "프로그램 제작하기"}
              </button>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label className="text-text-secondary">내용</Label>
          <LexicalEditor
            value={content}
            onChange={setContent}
            onUploadingChange={setEditorUploading}
          />
        </div>

        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <Label className="text-text-secondary">이미지</Label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="group relative h-20 w-20">
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-lg border border-border-default object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="이미지 삭제"
                  className="absolute -right-1 -top-1 rounded-full bg-error p-0.5 text-white opacity-100 transition-opacity focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-1 transition-colors focus-within:ring-2 focus-within:ring-interactive-primary hover:border-interactive-primary">
              <Upload className="h-5 w-5 text-text-tertiary" aria-hidden="true" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                aria-label="이미지 추가"
                className="sr-only"
              />
            </label>
          </div>
          {isUploading && (
            <p className="text-xs text-text-tertiary">업로드 중...</p>
          )}
        </div>

        <Button
          type="submit"
          className="glow-primary w-full bg-interactive-primary text-white hover:bg-interactive-primary/90"
          disabled={isSubmitting || uploadInProgress}
        >
          {isSubmitting
            ? "작성 중..."
            : uploadInProgress
              ? "이미지 업로드 중..."
              : "게시글 작성"}
        </Button>
      </form>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostInner />
    </Suspense>
  );
}
