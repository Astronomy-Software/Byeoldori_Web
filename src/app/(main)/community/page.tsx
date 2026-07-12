"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosts, getReviewPosts, getEducationPosts } from "@/lib/api/community";
import type { PostSummary } from "@/types/api";
import { Eye, Heart, MessageSquare, Star, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CommunityPage() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl bg-bg-page p-4 md:p-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-text-primary">
        커뮤니티
      </h1>
      <Tabs defaultValue="review">
        <TabsList className="mb-6 h-auto w-full justify-start gap-6 rounded-none border-b border-border-default bg-transparent p-0">
          <TabsTrigger
            value="review"
            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            관측 리뷰
          </TabsTrigger>
          <TabsTrigger
            value="program"
            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            교육 프로그램
          </TabsTrigger>
          <TabsTrigger
            value="free"
            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 text-sm font-medium text-text-tertiary shadow-none transition-colors hover:text-text-secondary data-active:border-aurora data-active:bg-transparent data-active:text-text-primary data-active:shadow-none"
          >
            자유게시판
          </TabsTrigger>
        </TabsList>
        <TabsContent value="free">
          <FreeBoard />
        </TabsContent>
        <TabsContent value="review">
          <ReviewBoard />
        </TabsContent>
        <TabsContent value="program">
          <ProgramBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FreeBoard() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    getPosts("FREE", page, 20, "LATEST", keyword || undefined)
      .then((r) => { setPosts(r.content); setTotalPages(r.totalPages); })
      .catch(() => {});
  }, [page, keyword]);

  return (
    <BoardLayout
      posts={posts}
      keyword={keyword}
      onSearch={setKeyword}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      linkPrefix="/community/free"
      createHref="/community/free/new"
      categoryLabel="자유"
    />
  );
}

function ReviewBoard() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    getReviewPosts(page, 20, "LATEST", keyword || undefined)
      .then((r) => { setPosts(r.content); setTotalPages(r.totalPages); })
      .catch(() => {});
  }, [page, keyword]);

  return (
    <GridBoardLayout
      posts={posts}
      keyword={keyword}
      onSearch={setKeyword}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      linkPrefix="/community/review"
      createHref="/community/review/new"
      categoryLabel="관측 리뷰"
      showScore
    />
  );
}

function ProgramBoard() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    getEducationPosts(page, 20, "LATEST", keyword || undefined)
      .then((r) => { setPosts(r.content); setTotalPages(r.totalPages); })
      .catch(() => {});
  }, [page, keyword]);

  return (
    <GridBoardLayout
      posts={posts}
      keyword={keyword}
      onSearch={setKeyword}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      linkPrefix="/community/program"
      createHref="/community/program/new"
      categoryLabel="교육 프로그램"
    />
  );
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
}: {
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

      {posts.length === 0 ? (
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
                  {post.authorNickname}
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

      {totalPages > 1 && (
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
            {page + 1} / {totalPages}
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
}: {
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
        {posts.length === 0 ? (
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
                  {post.contentSummary}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                  <span className="text-text-secondary">{post.authorNickname}</span>
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

      {totalPages > 1 && (
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
            {page + 1} / {totalPages}
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
