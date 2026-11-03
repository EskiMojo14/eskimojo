import { network } from "virtual:msw";
import { afterAll, afterEach, beforeAll } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { bypassLocalRequests } from "../common/msw";
import { renderWithProviders } from "./render";

import "#/shared/styles/index.css";
import "./setup.css";

page.extend({ renderWithProviders });

declare module "vitest/browser" {
  interface BrowserPage {
    renderWithProviders: typeof renderWithProviders;
  }
}

network.configure({
  context: { quiet: true },
  onUnhandledFrame: bypassLocalRequests(location.href),
});

beforeAll(() => network.enable());
afterEach(() => network.resetHandlers());
afterAll(() => network.disable());
