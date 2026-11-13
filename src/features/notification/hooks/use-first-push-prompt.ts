"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "lotto:push-prompt-dismissed:v1";

export function useFirstPushPrompt(isSignedIn: boolean) {
  const [shouldShow, setShouldShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (
        !isSignedIn ||
        !("Notification" in window) ||
        Notification.permission !== "default"
      )
        return;
      if (!window.localStorage.getItem(DISMISSED_KEY)) setShouldShow(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isSignedIn]);
  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setShouldShow(false);
  }
  return { dismiss, shouldShow };
}
