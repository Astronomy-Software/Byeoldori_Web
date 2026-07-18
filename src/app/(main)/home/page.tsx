"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarCard } from "@/components/calendar-card";
import { WeatherSection } from "@/components/weather-section";
import { getHomeReviews, getHomeEducations, getHomeFreePosts } from "@/lib/api/community";
import { getMonthlySummary } from "@/lib/api/calendar";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ReviewPostSummary,
  EducationPostSummary,
  PostSummary,
  MonthDaySummaryDto,
} from "@/types/api";
import { Eye, Heart, MessageSquare, Star } from "lucide-react";

export default function HomePage() {
  const now = new Date();
  const nickname = useAuthStore((s) => s.user?.nickname);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthDaySummaryDto[]>([]);

  const [reviews, setReviews] = useState<ReviewPostSummary[]>([]);
  const [eduPosts, setEduPosts] = useState<EducationPostSummary[]>([]);
  const [freePosts, setFreePosts] = useState<PostSummary[]>([]);

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const [postsError, setPostsError] = useState(false);

  // 위치 가져오기
  useEffect(() => {
    const FALLBACK = { lat: 36.6284, lon: 127.4572 }; // 충북대 기본값

    if (!navigator.geolocation) {
      setLocation(FALLBACK);
      return;
    }

    // 권한 프롬프트에 응답하지 않으면 콜백이 영영 안 와서 날씨 히어로가
    // 계속 비어 보인다 → 6초 안전 타이머로 기본 좌표를 먼저 채운다.
    // 이후 실제 위치가 오면 최신 좌표로 덮어쓴다.
    const fallbackTimer = setTimeout(() => setLocation(FALLBACK), 6000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(fallbackTimer);
        setLocation(FALLBACK);
      },
      { timeout: 10000, maximumAge: 600000 },
    );

    return () => clearTimeout(fallbackTimer);
  }, []);

  // 월별 요약
  useEffect(() => {
    getMonthlySummary(year, month)
      .then((res) => setMonthSummary(res))
      .catch(() => {});
  }, [year, month]);

  // 홈 전용 API (docs: /community/home/*)
  const loadHomePosts = useCallback(() => {
    setPostsError(false);
    Promise.all([
      getHomeReviews().then(setReviews),
      getHomeEducations().then(setEduPosts),
      getHomeFreePosts().then(setFreePosts),
    ]).catch(() => setPostsError(true));
  }, []);

  useEffect(() => {
    loadHomePosts();
  }, [loadHomePosts]);

  const calendarBadges = monthSummary.reduce(
    (acc, item) => {
      const total = (item.planned ?? 0) + (item.completed ?? 0) + (item.canceled ?? 0);
      acc[item.date] = total > 0 ? "#FFD76B" : "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const handlePrevMonth = useCallback(() => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }, [month]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }, [month]);

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* 헤더 */}
        <header>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            좋은 밤이에요, {nickname ?? "관측자"}님
          </h1>
          <p className="mt-1.5 font-mono text-sm text-text-tertiary">
            {now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일 · 오늘 밤 관측 브리핑
          </p>
        </header>

        {/* 적합도 히어로 (날씨 계기판) */}
        {location && <WeatherSection lat={location.lat} lon={location.lon} />}

        {/* 이번 주 관측 캘린더 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              관측 캘린더
            </h2>
            <Link
              href="/mypage/schedule"
              className="text-xs text-interactive-link hover:text-aurora"
            >
              더보기 &rarr;
            </Link>
          </div>
          <CalendarCard
            year={year}
            month={month}
            selectedDate={selectedDate}
            badges={calendarBadges}
            onSelect={setSelectedDate}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
          />
        </section>

        {/* 최근 관측 소식 */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">
            최근 관측 소식
          </h2>

          {postsError && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error"
            >
              <span>게시글을 불러오지 못했습니다.</span>
              <button
                type="button"
                onClick={loadHomePosts}
                className="shrink-0 rounded-lg border border-error/50 px-2 py-1 text-xs font-medium hover:bg-error/10"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 최근 리뷰 */}
          <CardPostSection
            title="관측 리뷰"
            category="리뷰"
            posts={reviews}
            linkPrefix="/community/review"
            showScore
          />

          {/* 최근 교육 프로그램 */}
          <CardPostSection
            title="교육 프로그램"
            category="교육"
            posts={eduPosts}
            linkPrefix="/community/program"
          />

          {/* 인기 자유게시글 */}
          <PostSection
            title="자유게시판"
            posts={freePosts}
            linkPrefix="/community/free"
          />
        </section>
      </div>
    </div>
  );
}

function CardPostSection({
  title,
  category,
  posts,
  linkPrefix,
  showScore,
}: {
  title: string;
  category?: string;
  posts: PostSummary[];
  linkPrefix: string;
  showScore?: boolean;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        <Link
          href="/community"
          className="text-xs text-interactive-link hover:text-aurora"
        >
          더보기 &rarr;
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-text-tertiary">게시글이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="group overflow-hidden rounded-2xl border border-border-default bg-surface-1 transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={300}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                    <Star className="h-8 w-8" />
                  </div>
                )}
                {category && (
                  <span className="absolute left-2 top-2 rounded-md bg-bg-page/70 px-1.5 py-0.5 text-[10px] font-medium text-aurora backdrop-blur">
                    {category}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-text-primary line-clamp-2">
                  {post.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-tertiary">
                  {showScore && post.score != null ? (
                    <span className="flex items-center gap-0.5 text-warning">
                      <Star className="h-3 w-3 fill-warning" />
                      <span className="font-mono">{post.score.toFixed(1)}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      <span className="font-mono">{post.viewCount}</span>
                    </span>
                  )}
                  <span className="truncate">{post.authorNickname}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PostSection({
  title,
  posts,
  linkPrefix,
}: {
  title: string;
  posts: PostSummary[];
  linkPrefix: string;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">{title}</h3>
        <Link
          href="/community"
          className="text-xs text-interactive-link hover:text-aurora"
        >
          더보기 &rarr;
        </Link>
      </div>
      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="text-sm text-text-tertiary">게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="block rounded-xl border border-border-default bg-surface-1 p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <p className="text-sm font-medium text-text-primary line-clamp-1">
                {post.title}
              </p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-text-tertiary">
                <span className="truncate text-text-secondary">
                  {post.authorNickname}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />{" "}
                  <span className="font-mono">{post.viewCount}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />{" "}
                  <span className="font-mono">{post.likeCount}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />{" "}
                  <span className="font-mono">{post.commentCount}</span>
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
