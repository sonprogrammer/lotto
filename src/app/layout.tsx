import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "로또 6/45 | 행운의 번호 미리보기",
  description: "공이 순서대로 멈추며 공개되는 로또 6/45 랜덤 번호 미리보기",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
