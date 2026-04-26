"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPosts, getReviewPosts, getEducationPosts } from "@/lib/api/community";
import type { PostSummary } from "@/types/api";
import { Eye, Heart, MessageSquare, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-bold text-foreground">커뮤니티</h1>
      <Tabs defaultValue="free">
        <TabsList className="mb-4 w-full bg-purple-900/30">
          <TabsTrigger value="free" className="flex-1">자유게시판</TabsTrigger>
          <TabsTrigger value="review" className="flex-1">관측 리뷰</TabsTrigger>
          <TabsTrigger value="program" className="flex-1">교육 프로그램</TabsTrigger>
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
    <BoardLayout
      posts={posts}
      keyword={keyword}
      onSearch={setKeyword}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      linkPrefix="/community/review"
      createHref="/community/review/new"
      showScore
      showThumbnail
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
    <BoardLayout
      posts={posts}
      keyword={keyword}
      onSearch={setKeyword}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      linkPrefix="/community/program"
      createHref="/community/program/new"
      showThumbnail
    />
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
  showScore,
  showThumbnail,
}: {
  posts: PostSummary[];
  keyword: string;
  onSearch: (k: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  linkPrefix: string;
  createHref: string;
  showScore?: boolean;
  showThumbnail?: boolean;
}) {
  const [searchInput, setSearchInput] = useState(keyword);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(searchInput); }}
          className="flex-1"
        />
        <Link href={createHref}>
          <Button className="bg-purple-600 hover:bg-purple-700">글쓰기</Button>
        </Link>
      </div>

      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            게시글이 없습니다.
          </p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="flex gap-3 rounded-lg bg-card/50 p-3 transition-colors hover:bg-card"
            >
              {/* 썸네일 */}
              {showThumbnail && post.thumbnailUrl && (
                <img
                  src={post.thumbnailUrl}
                  alt="썸네일"
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {post.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {post.contentSummary}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.authorNickname}</span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> {post.viewCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3 w-3" /> {post.likeCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="h-3 w-3" /> {post.commentCount}
                  </span>
                  {showScore && post.score != null && (
                    <span className="flex items-center gap-0.5 text-warning">
                      <Star className="h-3 w-3 fill-warning" />
                      {post.score.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            이전
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
