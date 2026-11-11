"use client";

import { useState } from "react";

export function FrequencyGapHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="frequency-help" data-open={isOpen}>
      <button
        aria-describedby="frequency-gap-tooltip"
        aria-expanded={isOpen}
        aria-label="미출현 회차 설명"
        className="frequency-help-button"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        i
      </button>
      <span
        className="frequency-tooltip"
        id="frequency-gap-tooltip"
        role="tooltip"
      >
        미출현 회차는 기준 회차부터 거슬러 올라가며 연속으로 나오지 않은 회차
        수예요. 예를 들어 1249회 기준 1회 미출현은 1249회에는 나오지 않고
        1248회에는 나왔다는 뜻이에요. 미출현 횟수가 길어도 다음 회차 당첨 확률이
        높아지지는 않아요.
      </span>
    </span>
  );
}
