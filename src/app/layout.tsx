import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/shared/providers/query-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://lotto-amber.vercel.app/"),
  title: "로또 6/45 | 행운의 번호 미리보기",
  description: "공이 순서대로 멈추며 공개되는 로또 6/45 랜덤 번호 미리보기",
  icons: {
    icon: [{ url: "/lotto_icon.png", type: "image/png", sizes: "627x627" }],
    apple: [{ url: "/lotto_icon.png", type: "image/png", sizes: "627x627" }],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로또 6/45",
    title: "로또 6/45 | 행운의 번호 미리보기",
    description: "공이 순서대로 멈추며 공개되는 로또 6/45 랜덤 번호 미리보기",
    images: [
      {
        url: "/lotto_og.png",
        width: 1731,
        height: 909,
        alt: "로또 6/45",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "로또 6/45 | 행운의 번호 미리보기",
    description: "공이 순서대로 멈추며 공개되는 로또 6/45 랜덤 번호 미리보기",
    images: ["/lotto_og.png"],
  },
  appleWebApp: { capable: true, title: "로또 6/45", statusBarStyle: "default" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="top-center"
            duration={3500}
            closeButton
            richColors
          />
        </QueryProvider>
      </body>
    </html>
  );
}
