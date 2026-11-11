export default function Loading() {
  return (
    <main className="app-loading-shell" role="status" aria-busy="true">
      <span className="visually-hidden">화면을 불러오고 있어요.</span>
      <div className="app-loading-header">
        <span className="app-loading-mark" />
        <span className="app-loading-action" />
      </div>
      <div className="app-loading-content">
        <span className="app-loading-title" />
        <span className="app-loading-line" />
        <div className="app-loading-ball-row">
          {Array.from({ length: 6 }, (_, index) => (
            <span className="app-loading-ball" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
