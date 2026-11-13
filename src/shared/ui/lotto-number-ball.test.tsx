import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LottoNumberBall } from "./lotto-number-ball";

it("uses the shared official number color bands", () => {
  render(
    <div>
      {[1, 11, 21, 31, 41].map((number) => (
        <LottoNumberBall key={number} number={number} />
      ))}
    </div>,
  );

  expect(screen.getByText("1")).toHaveClass("lotto-ball-gold");
  expect(screen.getByText("11")).toHaveClass("lotto-ball-blue");
  expect(screen.getByText("21")).toHaveClass("lotto-ball-red");
  expect(screen.getByText("31")).toHaveClass("lotto-ball-gray");
  expect(screen.getByText("41")).toHaveClass("lotto-ball-green");
});

it("renders an accessible selectable ball when a click handler is supplied", () => {
  render(
    <LottoNumberBall
      number={7}
      label="7번 고정"
      selected
      onClick={() => undefined}
    />,
  );

  expect(screen.getByRole("button", { name: "7번 고정" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
