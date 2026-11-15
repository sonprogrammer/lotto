export function ProtectedLayoutFallback() {
  return (
    <div className="min-h-screen bg-slate-50" aria-busy="true" role="status">
      <p className="sr-only">로그인 상태를 확인하고 있어요.</p>
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="h-7 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
      </header>
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      </main>
    </div>
  );
}
