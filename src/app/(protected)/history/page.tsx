import type { Metadata } from "next";
import { LotteryDrawHistory } from "@/features/analysis/components/lottery-draw-history";

export const metadata: Metadata = {
  title: "회차별 당첨 내역 | 로또 6/45",
  description:
    "현재까지 공개된 로또 6/45 회차별 당첨 번호와 당첨금을 확인합니다.",
};

export default function HistoryPage() {
  return <LotteryDrawHistory />;
}
