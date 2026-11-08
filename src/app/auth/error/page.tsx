import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="auth-error-shell">
      <div className="auth-error-card">
        <span className="auth-error-mark" aria-hidden="true">
          !
        </span>
        <p className="auth-error-eyebrow">KAKAO LOGIN</p>
        <h1>로그인을 완료하지 못했어요</h1>
        <p className="auth-error-description">
          Supabase와 카카오 로그인 설정을 확인한 뒤 다시 시도해 주세요.
        </p>
        <Link className="auth-error-link" href="/">
          랜덤 번호 화면으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
