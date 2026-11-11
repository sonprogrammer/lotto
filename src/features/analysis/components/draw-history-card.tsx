import type { LotteryDrawHistoryRow } from "../hooks/use-lottery-draw-history";

type DrawHistoryCardProps = {
  draw: LotteryDrawHistoryRow;
};

function formatDrawDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatPrize(amount: number) {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

function getNumberTone(number: number) {
  if (number <= 10) return "gold";
  if (number <= 20) return "blue";
  if (number <= 30) return "red";
  if (number <= 40) return "gray";
  return "green";
}

export function DrawHistoryCard({ draw }: DrawHistoryCardProps) {
  return (
    <li className="draw-history-item">
      <article className="draw-history-card">
        <header className="draw-history-heading">
          <h2>{draw.roundNumber}회</h2>
          <time dateTime={draw.drawDate}>{formatDrawDate(draw.drawDate)}</time>
        </header>
        <ul
          className="draw-history-numbers"
          aria-label={`${draw.roundNumber}회 당첨 번호`}
        >
          {draw.numbers.map((number) => (
            <li
              className={`history-ball lotto-ball-${getNumberTone(number)}`}
              key={number}
            >
              {number}
            </li>
          ))}
          <li className="draw-history-bonus">보너스 {draw.bonusNumber}</li>
        </ul>
        <ul className="draw-history-prizes" aria-label="등위별 당첨금">
          {draw.prizesByRank.map(({ rank, winnerCount, amountPerWinner }) => (
            <li key={rank}>
              <span>
                {rank}등 · {winnerCount.toLocaleString("ko-KR")}명
              </span>
              <strong>{formatPrize(amountPerWinner)}</strong>
            </li>
          ))}
        </ul>
      </article>
    </li>
  );
}
