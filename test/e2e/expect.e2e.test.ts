import { describe } from "vite-plus/test";

import { expect, test } from "#test/e2e";

const html = String.raw;

describe("Playwright expect with Vitest fixtures", () => {
  test("locator assertions retry changing DOM state", async ({ page }) => {
    await page.setContent(html`<h1>Loading</h1>`);
    const heading = page.getByRole("heading");
    await page.evaluate(() => {
      setTimeout(() => {
        const element = document.querySelector("h1")!;
        element.textContent = "Ready";
        element.setAttribute("data-state", "ready");
      }, 100);
    });

    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Ready");
    await expect(heading).toContainText(/Ready/);
    await expect(heading).toHaveAttribute("data-state", "ready");
    await expect(heading).toHaveCount(1);
  });

  test("negated assertions retry until an element is removed", async ({ page }) => {
    await page.setContent(html`<h1>Loading</h1>`);
    await page.evaluate(() => {
      setTimeout(() => document.querySelector("h1")?.remove(), 100);
    });

    await expect(page.getByRole("heading")).not.toBeVisible();
    await expect(page.getByRole("heading")).toHaveCount(0);
  });

  test("page assertions retry title and URL changes", async ({ page }) => {
    await page.evaluate(() => {
      document.title = "Loading";
      setTimeout(() => {
        document.title = "Projects";
        location.hash = "projects";
      }, 100);
    });

    await expect(page).toHaveTitle("Projects");
    await expect(page).not.toHaveTitle("Loading");
    await expect(page).toHaveURL(/#projects$/);
    await expect(page).toHaveURL((url) => url.hash === "#projects");
  });

  test("matcher timeouts reject with diagnostic errors", async ({ page }) => {
    await page.setContent(html`<h1>Loading</h1>`);
    await expect(
      expect(page.getByRole("heading")).toHaveText("Ready", { timeout: 100 }),
    ).rejects.toThrow(/Loading/);
  });
});
