import { network } from "virtual:msw";
import { afterAll, afterEach, beforeAll } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { renderWithProviders } from "./render";

import "#/shared/styles/index.css";
import "./setup.css";

page.extend({ renderWithProviders });

declare module "vitest/browser" {
  interface BrowserPage {
    renderWithProviders: typeof renderWithProviders;
  }
}

beforeAll(() => network.enable());
afterEach(() => network.resetHandlers());
afterAll(() => network.disable());
