import { describe } from "vite-plus/test";

import { expect, test } from "#test/e2e";

const html = String.raw;

describe("receiver validation", () => {
  test.each(["foo", null, undefined, 42, {}])(
    "page matchers reject invalid receiver %j",
    async (received) => {
      await expect(expect(received).toHaveTitle("Projects")).rejects.toThrow(
        "toHaveTitle requires a Playwright Page",
      );
      expect(() => expect(received).toHaveURL("about:blank")).toThrow(
        "toHaveURL requires a Playwright Page",
      );
    },
  );

  test.each(["foo", null, undefined, 42, {}])(
    "locator matchers reject invalid receiver %j",
    async (received) => {
      await expect(expect(received).toBeVisible()).rejects.toThrow(
        "toBeVisible requires a Playwright Locator",
      );
      await expect(expect(received).toHaveTextContent("text")).rejects.toThrow(
        "toHaveTextContent requires a Playwright Locator",
      );
      await expect(expect(received).toMatchTextContent("text")).rejects.toThrow(
        "toMatchTextContent requires a Playwright Locator",
      );
      await expect(expect(received).toHaveAttribute("title")).rejects.toThrow(
        "toHaveAttribute requires a Playwright Locator",
      );
    },
  );

  test("Page and Locator receivers are not interchangeable, including negation", async ({
    page,
  }) => {
    const locator = page.locator("main");
    await expect(expect(locator).not.toHaveTitle("Projects")).rejects.toThrow(
      "toHaveTitle requires a Playwright Page",
    );
    expect(() => expect(locator).not.toHaveURL("about:blank")).toThrow(
      "toHaveURL requires a Playwright Page",
    );
    await expect(expect(page).not.toBeVisible()).rejects.toThrow(
      "toBeVisible requires a Playwright Locator",
    );
    await expect(expect("foo").toHaveTitle("Projects")).rejects.toThrow(/received.*foo/);
  });
});

describe("expect.locator", () => {
  test("locator assertions retry until elements appear and change", async ({ page }) => {
    await page.setContent(html`
      <script>
        setTimeout(() => {
          const heading = document.createElement("h1");
          heading.textContent = "  Ready   to go  ";
          heading.setAttribute("data-state", "ready");
          document.body.append(heading);
        }, 100);
      </script>
    `);

    const heading = page.getByRole("heading");
    await expect.locator(heading).toBeVisible();
    await expect.locator(heading).toHaveTextContent("Ready to go");
    await expect.locator(heading).toMatchTextContent(/Ready\s+to go/g);
    await expect.locator(heading).toHaveAttribute("data-state", "ready");
    await expect.locator(heading).toHaveAttribute("data-state");
    await expect.locator(heading).toHaveAttribute("data-state", expect.stringMatching(/^ready$/));
    await expect.poll(() => heading.count()).toBe(1);
  });

  test("text, attribute, and count assertions retry changing DOM state", async ({ page }) => {
    await page.setContent(html`<h1>Loading</h1>`);
    const heading = page.getByRole("heading");
    await page.evaluate(() => {
      setTimeout(() => {
        document.querySelector("h1")!.textContent = "Ready";
      }, 100);
    });
    await expect.locator(heading).toHaveTextContent("Ready");

    await page.evaluate(() => {
      setTimeout(() => document.querySelector("h1")!.setAttribute("data-state", "ready"), 100);
    });
    await expect.locator(heading).toHaveAttribute("data-state", "ready");

    await page.evaluate(() => {
      setTimeout(() => document.querySelector("h1")!.removeAttribute("data-state"), 100);
    });
    await expect.locator(heading).not.toHaveAttribute("data-state");

    await page.evaluate(() => {
      setTimeout(() => document.body.append(document.createElement("h1")), 100);
    });
    await expect.poll(() => heading.count()).toBe(2);
  });

  test("negated locator assertions retry until an element is removed", async ({ page }) => {
    await page.setContent(html`<h1>Loading</h1>`);
    await page.evaluate(() => {
      setTimeout(() => document.querySelector("h1")?.remove(), 100);
    });

    const heading = page.getByRole("heading");
    await expect.locator(heading).not.toBeVisible();
    await expect.locator(heading).not.toHaveTextContent("Loading");
    await expect.locator(heading).not.toHaveAttribute("data-state", "loading");
    await expect.poll(() => heading.count()).toBe(0);
  });

  test("missing elements cannot satisfy empty text or attributes", async ({ page }) => {
    await page.setContent(html`<main></main>`);
    const heading = page.getByRole("heading");

    await expect(expect.locator(heading, { timeout: 50 }).toHaveTextContent("")).rejects.toThrow();
    await expect(
      expect.locator(heading, { timeout: 50 }).toHaveAttribute("data-state", ""),
    ).rejects.toThrow();
  });

  test("ambiguous locators fail even for negated text assertions", async ({ page }) => {
    await page.setContent(
      html`<h1>One</h1>
        <h1>Two</h1>`,
    );
    await expect(
      expect.locator(page.getByRole("heading"), { timeout: 50 }).not.toHaveTextContent("Three"),
    ).rejects.toThrow("at most one element");
  });

  test("text assertions support Browser Mode exact, partial, numeric, and whitespace options", async ({
    page,
  }) => {
    await page.setContent(
      html`<h1>Ready to go</h1>
        <p>42</p>
        <div></div>`,
    );
    const heading = page.getByRole("heading");
    await heading.evaluate((element) => {
      element.textContent = "  Ready   to go  ";
    });
    await expect.locator(heading).toHaveTextContent();
    await expect.locator(heading).toHaveTextContent("Ready to go");
    await expect.locator(heading).not.toHaveTextContent("Ready");
    await expect.locator(heading).toMatchTextContent("Ready");
    await expect.locator(heading).toHaveTextContent("  Ready   to go  ", {
      normalizeWhitespace: false,
    });
    await expect.locator(heading).toMatchTextContent("Ready   to", { normalizeWhitespace: false });
    await expect.locator(page.locator("p")).toHaveTextContent(42);
    await expect.locator(page.locator("p")).toMatchTextContent(2);
    await expect.locator(page.locator("div")).not.toHaveTextContent();
  });

  test("attribute assertions support Browser Mode asymmetric matchers", async ({ page }) => {
    await page.setContent(html`<h1 data-state="ready" data-empty="">Ready</h1>`);
    const heading = page.getByRole("heading");
    await expect.locator(heading).toHaveAttribute("data-state", expect.stringContaining("read"));
    await expect.locator(heading).toHaveAttribute("data-state", expect.stringMatching(/^ready$/));
    await expect.locator(heading).not.toHaveAttribute("data-state", /ready/);
    await expect.locator(heading).toHaveAttribute("data-empty", "");
    await expect.locator(heading).not.toHaveAttribute("data-missing");
  });
});

describe("expect.page", () => {
  test("page title assertions retry and support strings, regexes, and negation", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.title = "Loading";
      setTimeout(() => {
        document.title = "Projects";
      }, 100);
    });

    await expect.page(page).not.toHaveTitle("Loading");
    await expect.page(page).toHaveTitle("Projects");
    await expect.page(page).toHaveTitle(/^Projects$/g);
    await expect.page(page).toHaveTitle(/^Projects$/g);
  });

  test("page URL assertions retry and support strings, regexes, and predicates", async ({
    page,
  }) => {
    await page.evaluate(() => {
      setTimeout(() => {
        location.hash = "projects";
      }, 100);
    });

    await expect.page(page).not.toHaveURL("about:blank");
    await expect.page(page).toHaveURL("about:blank#projects");
    await expect.page(page).toHaveURL(/#projects$/g);
    await expect.page(page).toHaveURL((url) => url.hash === "#projects");
    await expect.page(page).not.toHaveURL((url) => url.hash === "#home");
  });

  test("page assertions honor polling timeouts and report actual values", async ({ page }) => {
    await expect(expect.page(page, { timeout: 50 }).toHaveTitle("Missing title")).rejects.toThrow(
      "Missing title",
    );
    await expect(
      expect.page(page, { timeout: 50 }).toHaveURL("https://example.test/"),
    ).rejects.toThrow("about:blank");
  });
});
