import { Suspense, isValidElement } from "react";
import { expect, it } from "vitest";

import ProtectedLayout from "./layout";

it("places the shared protected content behind a loading boundary", () => {
  const child = <div>private page</div>;
  const result = ProtectedLayout({ children: child });
  expect(isValidElement(result)).toBe(true);
  expect(result?.type).toBe(Suspense);
  expect(result?.props.children.props.children).toBe(child);
});
