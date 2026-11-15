import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { IntentPrefetchLink } from "./intent-prefetch-link";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    onFocus,
    onMouseEnter,
    onTouchStart,
  }: {
    children: ReactNode;
    href: string;
    prefetch: boolean;
    onFocus: () => void;
    onMouseEnter: () => void;
    onTouchStart: () => void;
  }) => (
    <a
      href={href}
      data-prefetch={String(prefetch)}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
    >
      {children}
    </a>
  ),
}));

it("starts prefetching when a navigation link is pointed at", () => {
  render(
    <IntentPrefetchLink href="/analysis">이번 주 분석</IntentPrefetchLink>,
  );
  const link = screen.getByRole("link", { name: "이번 주 분석" });

  expect(link).toHaveAttribute("data-prefetch", "false");
  fireEvent.mouseEnter(link);
  expect(link).toHaveAttribute("data-prefetch", "true");
});

it.each([
  ["keyboard focus", fireEvent.focus],
  ["touch start", fireEvent.touchStart],
])("supports prefetch on %s", (_intent, startIntent) => {
  render(
    <IntentPrefetchLink href="/analysis">이번 주 분석</IntentPrefetchLink>,
  );
  const link = screen.getByRole("link", { name: "이번 주 분석" });

  startIntent(link);

  expect(link).toHaveAttribute("data-prefetch", "true");
});
