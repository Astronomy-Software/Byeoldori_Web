"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  getPostDetail,
  updateEducation,
  updatePost,
  updateReview,
} from "@/lib/api/community";
import { uploadImage } from "@/lib/api/files";
import { getSitesByKeyword } from "@/lib/api/observation-sites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { editorStateHasContent } from "@/lib/community/content-text";
import { clientErrorMessage } from "@/lib/api/error-message";
import {
  exceedsImageLimit,
  POST_IMAGE_LIMIT_MESSAGE,
  POST_TITLE_MAX_LENGTH,
} from "@/lib/community/post-limits";
import { COMMUNITY_TAB_LABELS, communityHref, routeTypeToTab } from "@/lib/community/board-query";
import { goBack } from "@/lib/navigation/in-app-history";
import { findSiteByExactName } from "@/lib/community/review-site";
import { resolveEditedSite } from "@/lib/community/review-payload";
import { resolveEditedTargets, targetsToLines } from "@/lib/community/education-post-payload";
import type { ObservationSite, ReviewDto } from "@/types/api";
import { ArrowLeft, Star, Upload, X } from "lucide-react";
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
  // 서버가 정한 게시판 종류(REVIEW|EDUCATION|FREE). 서버는 글 종류에 맞는 필드만 반영한다.
  const [postType, setPostType] = useState("");
  // 관측 리뷰 처음 값 — 관측지 연결·대상 천체는 화면에서 고치지 않아도 다시 보내야 지워지지 않는다.
  const [originalReview, setOriginalReview] = useState<ReviewDto | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteSuggestions, setSiteSuggestions] = useState<ObservationSite[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  // 교육 프로그램 — 천체 이름은 한 줄에 하나. 고치지 않으면 처음 목록을 그대로 다시 보낸다.
  const [originalTargets, setOriginalTargets] = useState<string[]>([]);
  const [objectName, setObjectName] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // 본문 에디터 안의 이미지 업로드 진행 여부 — 끝나기 전에 저장하면 이미지가 빠진다.
  const [editorUploading, setEditorUploading] = useState(false);
  const uploadInProgress = isUploading || editorUploading;
  const isReview = postType === "REVIEW";
  const isEducation = postType === "EDUCATION";

  useEffect(() => {
    getPostDetail(postId)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setImageUrls(post.images ?? []);
        setPostType(String(post.type ?? "").toUpperCase());
        if (post.review) {
          setOriginalReview(post.review);
          setSiteName(post.review.location ?? "");
          setRating(post.review.score ?? null);
        }
        if (post.education) {
          setOriginalTargets(post.education.targets ?? []);
          setObjectName(targetsToLines(post.education.targets));
          setDifficulty(post.education.difficulty ?? "");
        }
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("게시글을 불러오지 못했습니다.");
        goBack(router, communityHref(routeTypeToTab(params.type)));
      });
  }, [postId, router, params.type]);

  // 관측지 이름 자동완성(작성 화면과 같다). 고르면 리뷰가 그 관측지에 연결된다.
  useEffect(() => {
    if (!isReview) return;
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
  }, [siteName, isReview]);

  // 조회 실패는 그대로 던진다 — 연결을 확인하지 못한 채 저장하면 서버가 기존 연결을 끊는다.
  async function findSiteIdByName(name: string) {
    const fromSuggestions = findSiteByExactName(siteSuggestions, name);
    if (fromSuggestions) return fromSuggestions.id;
    return findSiteByExactName(await getSitesByKeyword(name.trim()), name)?.id;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    // 서버가 20장 넘는 첨부를 거부하므로 올리기 전에 막는다.
    if (exceedsImageLimit(imageUrls.length, files.length)) {
      toast.error(POST_IMAGE_LIMIT_MESSAGE);
      e.target.value = "";
      return;
    }
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
      e.target.value = "";
    }
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (uploadInProgress) {
      toast.error("이미지 업로드가 끝난 뒤 다시 시도해주세요.");
      return;
    }
    if (!title.trim() || !editorStateHasContent(content)) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      if (isReview) {
        const site = await resolveEditedSite(
          originalReview ?? {},
          siteName,
          findSiteIdByName,
        );
        if (!site.ok) {
          toast.error(site.message);
          return;
        }
        await updateReview(postId, {
          title,
          content,
          imageUrls,
          siteName,
          rating,
          observationSiteId: site.observationSiteId,
          clearLocation: site.clearLocation,
          targets: originalReview?.targets ?? [],
        });
      } else if (isEducation) {
        await updateEducation(postId, {
          title,
          content,
          imageUrls,
          difficulty,
          targets: resolveEditedTargets(originalTargets, objectName),
        });
      } else {
        await updatePost(postId, { title, content, imageUrls });
      }
      toast.success("게시글이 수정되었습니다.");
      // replace: 기록에 수정 화면이 남으면 '돌아가기'·삭제 후 이동이 수정 화면으로 간다.
      router.replace(`/community/${params.type}/${postId}`);
    } catch (e) {
      toast.error(clientErrorMessage(e, "수정에 실패했습니다."));
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
        onClick={() => goBack(router, `/community/${params.type}/${postId}`)}
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
            maxLength={POST_TITLE_MAX_LENGTH}
            placeholder="제목을 입력하세요"
            className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
        </div>
        {isReview && (
          <>
            <div>
              <label htmlFor="edit-siteName" className="mb-1.5 block text-sm font-medium text-text-secondary">관측지 이름</label>
              <Input
                id="edit-siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                list="edit-site-suggestions"
                autoComplete="off"
                aria-describedby="edit-siteName-help"
                className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
              />
              <datalist id="edit-site-suggestions">
                {siteSuggestions.map((site) => (
                  <option key={site.id} value={site.name} />
                ))}
              </datalist>
              <p id="edit-siteName-help" className="mt-1 text-xs text-text-tertiary">
                목록의 관측지를 고르면 관측지 페이지에 리뷰가 함께 표시됩니다.
              </p>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-text-secondary">평점 (1~5)</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    aria-label={`${i + 1}점`}
                    aria-pressed={rating === i + 1}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${rating != null && i < rating ? "fill-aurora text-aurora" : "text-text-tertiary"}`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-sm text-text-secondary">{rating ?? "-"}/5</span>
              </div>
            </div>
          </>
        )}

        {isEducation && (
          <>
            <div>
              <label htmlFor="edit-objectName" className="mb-1.5 block text-sm font-medium text-text-secondary">천체 이름</label>
              <Textarea
                id="edit-objectName"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                rows={3}
                aria-describedby="edit-objectName-help"
                className="border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
              />
              <p id="edit-objectName-help" className="mt-1 text-xs text-text-tertiary">
                한 줄에 하나씩 입력합니다.
              </p>
            </div>
            <div>
              <label htmlFor="edit-difficulty" className="mb-1.5 block text-sm font-medium text-text-secondary">난이도</label>
              <select
                id="edit-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-border-default bg-surface-1 px-3 py-2 text-sm text-text-primary"
              >
                {!difficulty && <option value="">선택 안 함</option>}
                <option value="BEGINNER">입문</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
              </select>
            </div>
          </>
        )}

        <div>
          <span id="edit-content-label" className="mb-1.5 block text-sm font-medium text-text-secondary">내용</span>
          <LexicalEditor
            ariaLabelledBy="edit-content-label"
            value={content}
            onChange={setContent}
            onUploadingChange={setEditorUploading}
          />
        </div>

        {/* 첨부 이미지: 빼거나 더 올릴 수 있다(저장하면 이 목록으로 바뀐다) */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-text-secondary">이미지</span>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={`${url}-${i}`} className="group relative h-20 w-20">
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
            <p className="mt-1 text-xs text-text-tertiary">업로드 중...</p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSaving || uploadInProgress}
          className="glow-primary w-full bg-interactive-primary text-white hover:bg-interactive-primary/90"
        >
          {isSaving ? "저장 중..." : uploadInProgress ? "이미지 업로드 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
