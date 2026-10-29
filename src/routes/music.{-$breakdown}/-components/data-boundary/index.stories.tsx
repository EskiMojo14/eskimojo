import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";

import { MusicDataError, MusicRefreshNotice } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Music/Data Errors",
  component: MusicDataError,
  args: { title: "Couldn't load listening statistics", onRetry: fn() },
  parameters: { layout: "padded", a11y: { test: "error" } },
});

export const Summary = meta.story({
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(args.title);
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Retry" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
});

export const TopMusic = meta.story({ args: { title: "Couldn't load top music" } });

export const RecentTracks = meta.story({ args: { title: "Couldn't load recent tracks" } });

export const RefreshFailed = meta.story({
  render: ({ onRetry }) => <MusicRefreshNotice onRetry={onRetry} isFetching={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("Showing the last loaded results.");
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeEnabled();
  },
});

export const RetryingRefresh = meta.story({
  render: ({ onRetry }) => <MusicRefreshNotice onRetry={onRetry} isFetching />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Retry" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Retry" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
});
