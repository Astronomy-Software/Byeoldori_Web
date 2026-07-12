"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarCardProps {
  year: number;
  month: number;
  selectedDate: string | null;
  badges: Record<string, string>;
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarCard({
  year,
  month,
  selectedDate,
  badges,
  onSelect,
  onPrev,
  onNext,
}: CalendarCardProps) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return cells;
  }, [year, month]);

  const today = new Date();
  const todayStr =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? String(today.getDate())
      : null;

  return (
    <div className="rounded-2xl border border-border-default bg-surface-1 p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-sm font-semibold text-text-primary">
          {year}년 {month}월
        </span>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-medium text-text-tertiary">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = selectedDate === dateStr;
          const isToday = String(day) === todayStr;
          const badgeColor = badges[dateStr];

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`relative flex h-9 items-center justify-center rounded-lg font-mono text-sm transition-colors
                ${
                  isSelected
                    ? "bg-interactive-primary text-white glow-primary"
                    : "text-text-secondary hover:bg-surface-2"
                }
                ${isToday && !isSelected ? "font-bold text-aurora" : ""}
              `}
            >
              {day}
              {badgeColor && (
                <span
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: badgeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
