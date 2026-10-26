import { createRef } from "react";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { ExternalLinkButton } from "./index";

test("forwards native anchor props and refs and keeps the icon decorative", async () => {
  const ref = createRef<HTMLAnchorElement>();
  const result = await page.renderWithProviders(
    <ExternalLinkButton
      ref={ref}
      href="https://example.com"
      icon={
        <svg aria-label="External">
          <title>External</title>
        </svg>
      }
    >
      Visit site
    </ExternalLinkButton>,
  );
  const link = result.getByRole("link", { name: "Visit site", exact: true });
  await expect.element(link).toHaveAttribute("href", "https://example.com");
  await expect.element(link).toHaveAttribute("target", "_blank");
  await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(ref.current).toBe(link.element());
  expect(result.getByRole("button").query()).toBeNull();
  expect(result.getByRole("img", { name: "External" }).query()).toBeNull();
});
