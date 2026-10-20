"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosts, getReviewPosts, getEducationPosts } from "@/lib/api/community";
import { previewSummary } from "@/components/editor/shared";
import type { PostResponse, PostSummary } from "@/types/api";
import { authorLabel } from "@/lib/community/comments";
import {
  buildCommunityQuery,
  isCommunityTab,
  parseCommunityQuery,
  type CommunityQuery,
} from "@/lib/community/board-query";
import { Eye, Heart, MessageSquare, Star, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityInner />
    </Suspense>
  );
}

// 탭·페이지·검색어는 URL 쿼리가 원본이다(뒤로 가기·홈 '더보기' 링크에서 복원).
function CommunityInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = parseCommunityQuery(searchParams);

  function navigate(next: CommunityQuery) {
    const qs = buildCommunityQuery(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const boardProps: BoardRouteProps = {
    page: query.page,
    keyword: query.keyword,
    onPageChange: (page) => navigate({ ...query, page }),
    // 검색하면 항상 첫 페이지부터 — 이전 페이지 번호가 남으면 결과가 비어 보인다.
    onSearch: (keyword) => navigate({ ...query, page: 0, keyword }),
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-bg-page p-4 md:p-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-text-primary">
        커뮤니티
      </h1>
      <Tabs
        value={query.tab}
        onValueChange={(v) => {
          if (isCommunityTab(v) && v !== query.tab) {
            navigate({ tab: v, page: 0, keyword: "" });
          }
        }}
      >
        <TabsList className="mb-6 h-auto w-full justify-start gap-6 rounded-none border-b border-border-default bg-transparent p-0">
          <TabsTrigger
            value="review"
            className="rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            관측 리뷰
          </TabsTrigger>
          <TabsTrigger
            value="program"
            className="rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            교육 프로그램
          </TabsTrigger>
          <TabsTrigger
            value="free"
            className="rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            자유게시판
          </TabsTrigger>
        </TabsList>
        <TabsContent value="free">
          {query.tab === "free" && <FreeBoard {...boardProps} />}
        </TabsContent>
        <TabsContent value="review">
          {query.tab === "review" && <ReviewBoard {...boardProps} />}
        </TabsContent>
        <TabsContent value="program">
          {query.tab === "program" && <ProgramBoard {...boardProps} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BoardRouteProps {
  page: number;
  keyword: string;
  onPageChange: (p: number) => void;
  onSearch: (k: string) => void;
}

type BoardKind = "FREE" | "REVIEW" | "EDUCATION";

function fetchBoard(
  kind: BoardKind,
  page: number,
  keyword: string,
): Promise<PostResponse> {
  const k = keyword || undefined;
  if (kind === "REVIEW") return getReviewPosts(page, 20, "LATEST", k);
  if (kind === "EDUCATION") return getEducationPosts(page, 20, "LATEST", k);
  return getPosts("FREE", page, 20, "LATEST", k);
}

interface BoardResult {
  key: string;
  posts: PostSummary[];
  totalPages: number;
  error: boolean;
}

// 로딩·실패를 '게시글이 없습니다'와 구분한다. 응답이 현재 요청 키와 다르면 로딩 중.
function useBoardPosts(kind: BoardKind, page: number, keyword: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<BoardResult | null>(null);
  const requestKey = `${kind}|${page}|${keyword}|${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    fetchBoard(kind, page, keyword)
      .then((r) => {
        if (!cancelled) {
          setResult({ key: requestKey, posts: r.content, totalPages: r.totalPages, error: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: requestKey, posts: [], totalPages: 0, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind, page, keyword, requestKey]);

  const loading = result?.key !== requestKey;
  return {
    posts: loading ? [] : (result?.posts ?? []),
    totalPages: result?.totalPages ?? 0,
    loading,
    error: !loading && !!result?.error,
    retry: () => setReloadCount((n) => n + 1),
  };
}

function FreeBoard(props: BoardRouteProps) {
  const state = useBoardPosts("FREE", props.page, props.keyword);
  return (
    <BoardLayout
      {...props}
      {...state}
      linkPrefix="/community/free"
      createHref="/community/free/new"
      categoryLabel="자유"
    />
  );
}

function ReviewBoard(props: BoardRouteProps) {
  const state = useBoardPosts("REVIEW", props.page, props.keyword);
  return (
    <GridBoardLayout
      {...props}
      {...state}
      linkPrefix="/community/review"
      createHref="/community/review/new"
      categoryLabel="관측 리뷰"
      showScore
    />
  );
}

function ProgramBoard(props: BoardRouteProps) {
  const state = useBoardPosts("EDUCATION", props.page, props.keyword);
  return (
    <GridBoardLayout
      {...props}
      {...state}
      linkPrefix="/community/program"
      createHref="/community/program/new"
      categoryLabel="교육 프로그램"
    />
  );
}

interface BoardStatusProps {
  loading: boolean;
  error: boolean;
  retry: () => void;
}

function BoardStatusMessage({ loading, error, retry }: BoardStatusProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="불러오는 중">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-interactive-primary border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
        <p className="text-sm text-error">게시글을 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg border border-error/50 px-3 py-1 text-xs font-medium text-error hover:bg-error/10"
        >
          다시 시도
        </button>
      </div>
    );
  }
  return null;
}

function GridBoardLayout({
  posts,
  keyword,
  onSearch,
  page,
  totalPages,
  onPageChange,
  linkPrefix,
  createHref,
  categoryLabel,
  showScore,
  loading,
  error,
  retry,
}: BoardStatusProps & {
  posts: PostSummary[];
  keyword: string;
  onSearch: (k: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  linkPrefix: string;
  createHref: string;
  categoryLabel: string;
  showScore?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(keyword);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input
          placeholder="검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(searchInput); }}
          className="flex-1 border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
        />
        <Link href={createHref}>
          <Button className="glow-primary bg-interactive-primary text-white hover:bg-interactive-primary/90">
            글쓰기
          </Button>
        </Link>
      </div>

      {loading || error ? (
        <BoardStatusMessage loading={loading} error={error} retry={retry} />
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <ImageIcon className="h-8 w-8 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-1 transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <div className="relative">
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-surface-2">
                    <ImageIcon className="h-8 w-8 text-text-tertiary" />
                  </div>
                )}
                <Badge className="absolute left-2 top-2 border-transparent bg-bg-page/70 text-[10px] font-medium text-text-secondary backdrop-blur">
                  {categoryLabel}
                </Badge>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                {showScore && post.score != null && (
                  <span className="flex items-center gap-0.5 font-mono text-xs text-aurora">
                    <Star className="h-3 w-3 fill-aurora" />
                    {post.score.toFixed(1)}
                  </span>
                )}
                <p className="line-clamp-2 text-sm font-medium leading-snug text-text-primary">
                  {post.title}
                </p>
                <span className="truncate text-xs text-text-secondary">
                  {authorLabel(post.authorNickname)}
                </span>
                <div className="mt-auto flex items-center gap-2.5 pt-1 text-xs text-text-tertiary">
                  <span className="flex items-center gap-0.5 font-mono">
                    <Eye className="h-3 w-3" /> {post.viewCount}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono">
                    <Heart className="h-3 w-3" /> {post.likeCount}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono">
                    <MessageSquare className="h-3 w-3" /> {post.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(totalPages > 1 || page > 0) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="text-text-secondary hover:text-text-primary"
          >
            이전
          </Button>
          <span className="flex items-center font-mono text-sm text-text-secondary">
            {page + 1} / {Math.max(totalPages, page + 1)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="text-text-secondary hover:text-text-primary"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

function BoardLayout({
  posts,
  keyword,
  onSearch,
  page,
  totalPages,
  onPageChange,
  linkPrefix,
  createHref,
  categoryLabel,
  loading,
  error,
  retry,
}: BoardStatusProps & {
  posts: PostSummary[];
  keyword: string;
  onSearch: (k: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  linkPrefix: string;
  createHref: string;
  categoryLabel: string;
}) {
  const [searchInput, setSearchInput] = useState(keyword);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input
          placeholder="검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(searchInput); }}
          className="flex-1 border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
        />
        <Link href={createHref}>
          <Button className="glow-primary bg-interactive-primary text-white hover:bg-interactive-primary/90">
            글쓰기
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {loading || error ? (
          <BoardStatusMessage loading={loading} error={error} retry={retry} />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MessageSquare className="h-8 w-8 text-text-tertiary" />
            <p className="text-sm text-text-tertiary">게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="flex gap-3 rounded-2xl border border-border-default bg-surface-1 p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <Badge className="mb-2 border-transparent bg-surface-2 text-[10px] font-medium text-text-secondary">
                  {categoryLabel}
                </Badge>
                <p className="line-clamp-1 text-base font-semibold leading-snug text-text-primary">
                  {post.title}
                </p>
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                  {previewSummary(post.contentSummary)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                  <span className="text-text-secondary">{authorLabel(post.authorNickname)}</span>
                  <span className="flex items-center gap-0.5 font-mono">
                    <Eye className="h-3 w-3" /> {post.viewCount}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono">
                    <Heart className="h-3 w-3" /> {post.likeCount}
                  </span>
                  <span className="flex items-center gap-0.5 font-mono">
                    <MessageSquare className="h-3 w-3" /> {post.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {(totalPages > 1 || page > 0) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="text-text-secondary hover:text-text-primary"
          >
            이전
          </Button>
          <span className="flex items-center font-mono text-sm text-text-secondary">
            {page + 1} / {Math.max(totalPages, page + 1)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="text-text-secondary hover:text-text-primary"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
