import { createRef } from "react";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { ExternalLinkIconButton } from "./index";

test("forwards anchor props and refs and hides the decorative icon", async () => {
  const ref = createRef<HTMLAnchorElement>();
  const result = await page.renderWithProviders(
    <ExternalLinkIconButton
      ref={ref}
      href="https://example.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit site"
      icon={
        <svg aria-label="External">
          <title>External</title>
        </svg>
      }
    />,
  );
  const link = result.getByRole("link", { name: "Visit site", exact: true });
  await expect.element(link).toHaveAttribute("href", "https://example.com");
  await expect.element(link).toHaveAttribute("target", "_blank");
  await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(ref.current).toBe(link.element());
  expect(result.getByRole("button").query()).toBeNull();
  expect(result.getByRole("img", { name: "External" }).query()).toBeNull();
});

test("supports an accessible name from a referenced label", async () => {
  const result = await page.renderWithProviders(
    <>
      <span id="destination-label">Watch on YouTube</span>
      <ExternalLinkIconButton
        href="https://www.youtube.com"
        aria-labelledby="destination-label"
        icon={<svg />}
      />
    </>,
  );
  await expect.element(result.getByRole("link", { name: "Watch on YouTube" })).toBeVisible();
});
