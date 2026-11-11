import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Loading from "./loading";

it("uses a neutral busy skeleton while the route checks the session", () => {
  render(<Loading />);

  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByText("화면을 불러오고 있어요.")).toBeInTheDocument();
  expect(screen.getByText("화면을 불러오고 있어요.")).toHaveClass(
    "visually-hidden",
  );
});
