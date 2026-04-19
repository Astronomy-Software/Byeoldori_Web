"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarCard } from "@/components/calendar-card";
import { WeatherSection } from "@/components/weather-section";
import { getReviewPosts, getEducationPosts, getPosts } from "@/lib/api/community";
import { getMonthlySummary } from "@/lib/api/calendar";
import type {
  ReviewPostSummary,
  EducationPostSummary,
  PostSummary,
  MonthDaySummaryDto,
} from "@/types/api";
import { Eye, Heart, MessageSquare } from "lucide-react";

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

  // 최근 게시물
  useEffect(() => {
    getReviewPosts(0, 5).then((r) => setReviews(r.content)).catch(() => {});
    getEducationPosts(0, 5).then((r) => setEduPosts(r.content)).catch(() => {});
    getPosts("FREE", 0, 5).then((r) => setFreePosts(r.content)).catch(() => {});
  }, []);

  const calendarBadges = monthSummary.reduce(
    (acc, item) => {
      acc[item.date] = item.count > 0 ? "#FFD76B" : "";
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

      {/* 최근 리뷰 */}
      <PostSection
        title="최근 관측 리뷰"
        posts={reviews}
        linkPrefix="/community/review"
      />

      {/* 최근 교육 프로그램 */}
      <PostSection
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
          href={linkPrefix}
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
