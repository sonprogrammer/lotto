"use client";

import { useEffect, useRef, useState } from "react";
import { getGuestDrawCount, MAX_GUEST_DRAWS } from "../lib/guest-draw-quota";

const STORAGE_KEY = "lotto-guest-draw-count:v1";

export function useGuestDrawLimit() {
  const countRef = useRef(0);
  const [drawCount, setDrawCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedCount = getGuestDrawCount(
          window.localStorage.getItem(STORAGE_KEY),
        );
        countRef.current = storedCount;
        setDrawCount(storedCount);
      } catch {
        countRef.current = 0;
      }

      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function tryRecordDraw() {
    if (!isReady) return false;

    let currentCount = countRef.current;

    try {
      currentCount = Math.max(
        currentCount,
        getGuestDrawCount(window.localStorage.getItem(STORAGE_KEY)),
      );
    } catch {
      // Keep using the in-memory count when browser storage is unavailable.
    }

    if (currentCount >= MAX_GUEST_DRAWS) {
      countRef.current = currentCount;
      setDrawCount(currentCount);
      return false;
    }

    const nextCount = currentCount + 1;
    countRef.current = nextCount;
    setDrawCount(nextCount);

    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextCount));
    } catch {
      // The current page session still enforces the limit in memory.
    }

    return true;
  }

  return { drawCount, isReady, tryRecordDraw };
}
