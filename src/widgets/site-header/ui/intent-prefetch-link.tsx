"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type IntentPrefetchLinkProps = {
  href: string;
  className?: string;
  ariaCurrent?: "page";
  children: ReactNode;
};

export function IntentPrefetchLink({
  href,
  className,
  ariaCurrent,
  children,
}: IntentPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  function enablePrefetch() {
    setShouldPrefetch(true);
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={ariaCurrent}
      prefetch={shouldPrefetch}
      onMouseEnter={enablePrefetch}
      onFocus={enablePrefetch}
      onTouchStart={enablePrefetch}
    >
      {children}
    </Link>
  );
}
