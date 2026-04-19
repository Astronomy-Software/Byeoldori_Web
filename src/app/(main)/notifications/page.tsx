"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/api/notification";
import type { NotificationItem } from "@/types/api";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((r) => {
        setItems(r.content);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  async function handleRead(id: number) {
    try {
      await markAsRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      toast.error("읽음 처리에 실패했습니다.");
    }
  }

  async function handleReadAll() {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("모두 읽음 처리되었습니다.");
    } catch {
      toast.error("처리에 실패했습니다.");
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReadAll}>
            <CheckCheck className="mr-1 h-4 w-4" /> 모두 읽음
          </Button>
        )}
      </div>

      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
        <Bell className="h-5 w-5" />
        알림
        {unread > 0 && (
          <span className="rounded-full bg-error px-2 py-0.5 text-xs text-white">
            {unread}
          </span>
        )}
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-card/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="mb-3 h-12 w-12 opacity-30" />
          <p>알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.isRead && handleRead(item.id)}
              className={`w-full rounded-lg p-4 text-left transition-colors ${
                item.isRead
                  ? "bg-card/30 opacity-60"
                  : "bg-card/70 hover:bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    item.isRead ? "bg-muted" : "bg-purple-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {item.body}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
