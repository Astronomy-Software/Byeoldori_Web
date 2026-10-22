"use client";

import { useEffect } from "react";
import { installInAppHistory } from "@/lib/navigation/in-app-history";

// 앱 안 화면 이동을 기록해 '돌아가기'가 사이트 밖으로 나가지 않게 한다(goBack 참고).
export function InAppHistoryTracker() {
  useEffect(() => {
    try {
      installInAppHistory(window.history);
    } catch {
      // 기록을 못 남기면 '돌아가기'는 대체 경로로 간다
    }
  }, []);
  return null;
}
