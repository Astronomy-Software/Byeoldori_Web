"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarCard } from "@/components/calendar-card";
import { WeatherSection } from "@/components/weather-section";
import { getHomeReviews, getHomeEducations, getHomeFreePosts } from "@/lib/api/community";
import { getMonthlySummary } from "@/lib/api/calendar";
import type {
  ReviewPostSummary,
  EducationPostSummary,
  PostSummary,
  MonthDaySummaryDto,
} from "@/types/api";
import { Eye, Heart, MessageSquare, Star } from "lucide-react";

export default function HomePage() {
  const now = new Date();
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation({ lat: 36.6284, lon: 127.4572 }), // 충북대 기본값
      );
    }
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
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-xl font-bold text-foreground">홈</h1>

      {/* 관측 캘린더 */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          관측 캘린더
        </h2>
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

      {/* 현재 날씨 */}
      {location && (
        <section>
          <WeatherSection lat={location.lat} lon={location.lon} />
        </section>
      )}

      {postsError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error"
        >
          <span>게시글을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={loadHomePosts}
            className="shrink-0 rounded-md border border-error/50 px-2 py-1 text-xs font-medium hover:bg-error/10"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 최근 리뷰 */}
      <CardPostSection
        title="최근 관측 리뷰"
        posts={reviews}
        linkPrefix="/community/review"
        showScore
      />

      {/* 최근 교육 프로그램 */}
      <CardPostSection
        title="교육 프로그램"
        posts={eduPosts}
        linkPrefix="/community/program"
      />

      {/* 인기 자유게시글 */}
      <PostSection
        title="자유게시판"
        posts={freePosts}
        linkPrefix="/community/free"
      />
    </div>
  );
}

function CardPostSection({
  title,
  posts,
  linkPrefix,
  showScore,
}: {
  title: string;
  posts: PostSummary[];
  linkPrefix: string;
  showScore?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Link
          href="/community"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          더보기 &rarr;
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="overflow-hidden rounded-xl bg-card/50 transition-colors hover:bg-card"
            >
              <img
                src={post.thumbnailUrl ?? "/byeoldori.png"}
                alt={post.title}
                width={300}
                height={300}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <div className="p-2">
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  {post.title}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  {showScore && post.score != null ? (
                    <span className="flex items-center gap-0.5 text-warning">
                      <Star className="h-3 w-3 fill-warning" />
                      {post.score.toFixed(1)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="truncate">{post.authorNickname}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
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
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Link
          href="/community"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          더보기 &rarr;
        </Link>
      </div>
      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`${linkPrefix}/${post.id}`}
              className="block rounded-lg bg-card/50 p-3 transition-colors hover:bg-card"
            >
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {post.title}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
