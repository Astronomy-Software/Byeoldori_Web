import { apiFetch } from "./client";
import type { NotificationItem, NotificationUnreadCount } from "@/types/api";

export async function getNotifications(
  page = 1,
  size = 20,
): Promise<{ content: NotificationItem[]; totalPages: number }> {
  return apiFetch<{ content: NotificationItem[]; totalPages: number }>(
    `notifications?page=${page}&size=${size}`,
  );
}

export async function getUnreadCount(): Promise<NotificationUnreadCount> {
  return apiFetch<NotificationUnreadCount>("notifications/unread-count");
}

export async function markAsRead(id: number): Promise<void> {
  return apiFetch<void>(`notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllAsRead(): Promise<void> {
  return apiFetch<void>("notifications/read-all", { method: "PATCH" });
}
