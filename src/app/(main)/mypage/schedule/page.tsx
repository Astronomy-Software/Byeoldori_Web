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
import { ArrowLeft, Plus, Check, Trash2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SchedulePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthDaySummaryDto[]>([]);
  const [dayPlans, setDayPlans] = useState<PlanDetailDto[]>([]);
  const [showNewPlan, setShowNewPlan] = useState(false);

  // 새 일정 폼
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSite, setNewSite] = useState("");
  const [newObject, setNewObject] = useState("");
  const [newStartAt, setNewStartAt] = useState("");
  const [newEndAt, setNewEndAt] = useState("");

  useEffect(() => {
    getMonthlySummary(year, month)
      .then((r) => setMonthSummary(r))
      .catch(() => {});
  }, [year, month]);

  useEffect(() => {
    if (selectedDate) {
      getEventsByDate(selectedDate)
        .then((r) => setDayPlans(r))
        .catch(() => setDayPlans([]));
    }
  }, [selectedDate]);

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
        description: newDesc,
        startAt: newStartAt,
        endAt: newEndAt,
        siteName: newSite,
        objectName: newObject,
      });
      toast.success("관측 일정이 추가되었습니다.");
      setShowNewPlan(false);
      setNewTitle("");
      setNewDesc("");
      setNewSite("");
      setNewObject("");
      // 새로고침
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
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">관측 일정 관리</h1>
        <Dialog open={showNewPlan} onOpenChange={setShowNewPlan}>
          <DialogTrigger>
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700">
              <Plus className="h-4 w-4" /> 새 일정
            </span>
          </DialogTrigger>
          <DialogContent className="bg-card border-purple-700/30">
            <DialogHeader>
              <DialogTitle>새 관측 일정</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <Label>제목</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>시작</Label>
                  <Input type="datetime-local" value={newStartAt} onChange={(e) => setNewStartAt(e.target.value)} required />
                </div>
                <div>
                  <Label>종료</Label>
                  <Input type="datetime-local" value={newEndAt} onChange={(e) => setNewEndAt(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>관측지</Label>
                <Input value={newSite} onChange={(e) => setNewSite(e.target.value)} />
              </div>
              <div>
                <Label>관측 대상</Label>
                <Input value={newObject} onChange={(e) => setNewObject(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
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

      {/* 선택된 날짜의 일정 */}
      {selectedDate && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {selectedDate} 일정
          </h2>
          {dayPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {dayPlans.map((plan) => {
                const isCompleted = plan.status?.name === "COMPLETED";
                return (
                  <div
                    key={plan.id}
                    className="rounded-lg bg-card/50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {plan.title}
                        </p>
                        {plan.siteName && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <MapPin className="mr-0.5 inline h-3 w-3" />
                            {plan.siteName}
                          </p>
                        )}
                        {plan.objectName && (
                          <p className="text-xs text-muted-foreground">
                            관측 대상: {plan.objectName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {isCompleted ? (
                          <Badge className="bg-success/20 text-success">완료</Badge>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleComplete(plan.id)}
                            title="관측 완료"
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </div>
                    {plan.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {plan.description}
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
  );
}
