import { network } from "virtual:msw";
import { afterAll, afterEach, beforeAll } from "vite-plus/test";

beforeAll(() => network.enable());
afterEach(() => network.resetHandlers());
afterAll(() => network.disable());
