"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarCard } from "@/components/calendar-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getMonthlySummary,
  getEventsByDate,
  createPlan,
  deletePlan,
  completeEvent,
} from "@/lib/api/calendar";
import type { PlanDetailDto, MonthDaySummaryDto } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, Check, Trash2, MapPin, Telescope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SchedulePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthDaySummaryDto[]>([]);
  const [dayPlans, setDayPlans] = useState<PlanDetailDto[]>([]);
  const [dayPlansError, setDayPlansError] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);

  // 새 일정 폼
  const [newTitle, setNewTitle] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newStartAt, setNewStartAt] = useState("");
  const [newEndAt, setNewEndAt] = useState("");

  useEffect(() => {
    getMonthlySummary(year, month)
      .then((r) => setMonthSummary(r))
      .catch(() => {});
  }, [year, month]);

  const loadDayPlans = useCallback((date: string) => {
    setDayPlansError(false);
    getEventsByDate(date)
      .then((r) => setDayPlans(r))
      .catch(() => {
        setDayPlans([]);
        setDayPlansError(true);
      });
  }, []);

  useEffect(() => {
    if (selectedDate) loadDayPlans(selectedDate);
  }, [selectedDate, loadDayPlans]);

  const calendarBadges = monthSummary.reduce(
    (acc, item) => {
      const total = (item.planned ?? 0) + (item.completed ?? 0) + (item.canceled ?? 0);
      acc[item.date] = total > 0 ? "#FFD76B" : "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const handlePrevMonth = useCallback(() => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }, [month]);

  const handleNextMonth = useCallback(() => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }, [month]);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPlan({
        title: newTitle,
        startAt: newStartAt,
        endAt: newEndAt || undefined,
        placeName: newPlaceName || undefined,
        targets: newTarget ? [newTarget] : undefined,
        memo: newMemo || undefined,
        status: "PLANNED",
      });
      toast.success("관측 일정이 추가되었습니다.");
      setShowNewPlan(false);
      setNewTitle("");
      setNewMemo("");
      setNewPlaceName("");
      setNewTarget("");
      setNewStartAt("");
      setNewEndAt("");
      if (selectedDate) {
        const r = await getEventsByDate(selectedDate);
        setDayPlans(r);
      }
      const ms = await getMonthlySummary(year, month);
      setMonthSummary(ms);
    } catch {
      toast.error("일정 추가에 실패했습니다.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await deletePlan(id);
      setDayPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success("일정이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleComplete(id: number) {
    try {
      const res = await completeEvent(id);
      setDayPlans((prev) =>
        prev.map((p) => (p.id === id ? res : p)),
      );
      toast.success("관측 완료로 기록되었습니다.");
    } catch {
      toast.error("완료 처리에 실패했습니다.");
    }
  }

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">관측 일정 관리</h1>
          <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
            <DialogTrigger>
              <span className="glow-primary inline-flex items-center gap-1 rounded-xl bg-interactive-primary px-3 py-2 text-sm font-medium text-text-on-primary transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" /> 새 일정
              </span>
            </DialogTrigger>
            <DialogContent className="glass border-border-default">
              <DialogHeader>
                <DialogTitle className="text-text-primary">새 관측 일정</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-3">
                <div>
                  <Label className="text-text-secondary">제목</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="border-border-default bg-surface-1 text-text-primary" />
                </div>
                <div>
                  <Label className="text-text-secondary">메모</Label>
                  <Textarea value={newMemo} onChange={(e) => setNewMemo(e.target.value)} className="border-border-default bg-surface-1 text-text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-text-secondary">시작</Label>
                    <Input type="datetime-local" value={newStartAt} onChange={(e) => setNewStartAt(e.target.value)} required className="border-border-default bg-surface-1 font-mono text-text-primary" />
                  </div>
                  <div>
                    <Label className="text-text-secondary">종료</Label>
                    <Input type="datetime-local" value={newEndAt} onChange={(e) => setNewEndAt(e.target.value)} className="border-border-default bg-surface-1 font-mono text-text-primary" />
                  </div>
                </div>
                <div>
                  <Label className="text-text-secondary">관측지</Label>
                  <Input value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} className="border-border-default bg-surface-1 text-text-primary" />
                </div>
                <div>
                  <Label className="text-text-secondary">관측 대상</Label>
                  <Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="border-border-default bg-surface-1 text-text-primary" />
                </div>
                <Button type="submit" className="glow-primary w-full bg-interactive-primary text-text-on-primary hover:opacity-90">
                  일정 추가
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

        {selectedDate && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="font-mono text-aurora">{selectedDate}</span> 일정
            </h2>
            {dayPlansError ? (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
              >
                <span>일정을 불러오지 못했습니다.</span>
                <button
                  type="button"
                  onClick={() => loadDayPlans(selectedDate)}
                  className="shrink-0 rounded-lg border border-error/50 px-2 py-1 text-xs font-medium hover:bg-error/10"
                >
                  다시 시도
                </button>
              </div>
            ) : dayPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-1 px-6 py-12 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-interactive-link">
                  <Telescope className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm text-text-tertiary">이 날의 관측 일정이 없어요.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayPlans.map((plan) => {
                  const isCompleted = plan.status === "COMPLETED";
                  return (
                    <div
                      key={plan.id}
                      className="rounded-2xl border border-border-default bg-surface-1 p-4 transition-colors hover:border-border-strong"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-text-primary">
                              {plan.title}
                            </p>
                            {isCompleted ? (
                              <Badge className="border-transparent bg-success/15 text-success">완료</Badge>
                            ) : (
                              <Badge className="border-transparent bg-warning/15 font-mono text-warning">예정</Badge>
                            )}
                          </div>
                          {plan.placeName && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-text-tertiary">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              {plan.placeName}
                            </p>
                          )}
                          {plan.targets && plan.targets.length > 0 && (
                            <p className="mt-0.5 text-xs text-text-secondary">
                              관측 대상: {plan.targets.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {isCompleted ? null : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-success hover:bg-success/10"
                              onClick={() => handleComplete(plan.id)}
                              title="관측 완료"
                              aria-label="관측 완료"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-error hover:bg-error/10"
                            onClick={() => handleDelete(plan.id)}
                            title="일정 삭제"
                            aria-label="일정 삭제"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      {plan.memo && (
                        <p className="mt-2 border-t border-border-default pt-2 text-xs text-text-tertiary">
                          {plan.memo}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
