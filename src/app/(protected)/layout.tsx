import { Suspense } from "react";
import { ProtectedLayoutContent } from "./protected-layout-content";
import { ProtectedLayoutFallback } from "./protected-layout-fallback";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<ProtectedLayoutFallback />}>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </Suspense>
  );
}
