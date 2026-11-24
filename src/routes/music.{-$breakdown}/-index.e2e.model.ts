import type { Page } from "playwright";

import type { MusicType } from "#/routes/music.{-$breakdown}/-constants";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import { expect, PageObjectModel, TabObjectModel } from "#test/e2e";

class TopRankingTab extends TabObjectModel<TopMusicTab> {
  url = "/music/top/tracks";
  tabName: string;

  constructor(page: Page, parent: TopMusicTab, type: MusicType) {
    super(page, parent);
    this.tabName = copy.topTabs.type[type].label;
    this.url = `/music/top/${type}`;
  }

  override matchesUrl(url: URL) {
    return this.parent.matchesUrl(url) && url.pathname === this.url;
  }

  override get tabPanel() {
    return this.parent.tabPanel.getByRole("tabpanel", { name: this.tabName, includeHidden: true });
  }
}

class TopMusicTab extends TabObjectModel<MusicPage> {
  url = "/music/top/tracks";
  tabName = copy.tabs.breakdown.top.label;
  tracks = new TopRankingTab(this.page, this, "tracks");
  albums = new TopRankingTab(this.page, this, "albums");
  artists = new TopRankingTab(this.page, this, "artists");

  get tabs() {
    return this.tabPanel.getByRole("tablist", { name: copy.topTabs.title });
  }

  override matchesUrl(url: URL) {
    return url.pathname.startsWith("/music/top/");
  }

  get periods() {
    return this.tabPanel.getByRole("group", { name: copy.periods.title });
  }

  period(name: string) {
    return this.periods.getByRole("link", { name, exact: true });
  }

  track(name: string) {
    return this.tabPanel.getByText(name, { exact: true });
  }

  artist(name: string) {
    return this.tabPanel.getByText(name, { exact: true });
  }

  album(name: string) {
    return this.albums.tabPanel.getByText(name, { exact: true });
  }

  artworkImage(name: string, imageUrl: string) {
    return this.tabPanel
      .getByRole("listitem")
      .filter({ hasText: name })
      .locator(`img[src="${imageUrl}"]`);
  }

  get loading() {
    return this.tabPanel.getByRole("progressbar", { name: copy.topMusic.loading });
  }

  get topTracks() {
    return this.tabPanel.getByRole("region", { name: copy.topMusic.titles.tracks, exact: true });
  }

  get topArtists() {
    return this.tabPanel.getByRole("region", { name: copy.topMusic.titles.artists, exact: true });
  }

  get emptyState() {
    return this.tabPanel.getByText(copy.topMusic.emptyTitle);
  }

  get error() {
    return this.tabPanel.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: copy.errors.top }),
    });
  }

  get retry() {
    return this.error.locator("..").getByRole("button", { name: copy.errors.retry, exact: true });
  }
}

class RecentTab extends TabObjectModel<MusicPage> {
  url = "/music/recent";
  tabName = copy.tabs.breakdown.recent.label;

  get loading() {
    return this.tabPanel.getByRole("progressbar", { name: copy.recentTracks.loading });
  }

  get emptyState() {
    return this.tabPanel.getByRole("heading", { name: copy.recentTracks.emptyTitle });
  }

  track(name: string) {
    return this.tabPanel.getByText(name, { exact: true });
  }

  artworkImage(name: string, imageUrl: string) {
    return this.tabPanel
      .getByRole("listitem")
      .filter({ hasText: name })
      .locator(`img[src="${imageUrl}"]`);
  }

  get error() {
    return this.tabPanel.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: copy.errors.recent }),
    });
  }

  get refreshNotice() {
    return this.tabPanel.getByRole("status").filter({
      hasText: copy.errors.refresh,
    });
  }

  get refreshRetry() {
    return this.tabPanel.getByRole("button", { name: copy.errors.retry, exact: true });
  }
}

export class MusicPage extends PageObjectModel {
  url = "/music";
  title = /^Music/;

  override matchesUrl(url: URL) {
    return url.pathname === this.url || url.pathname.startsWith(`${this.url}/`);
  }

  get navLink() {
    return this.page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Music", exact: true });
  }

  /** Navigate to the music page from the current page using the primary navigation. */
  async navigate() {
    await this.navLink.click();
    await expect(this.page).toHaveURL((url) => this.matchesUrl(url));
    await expect(this.page).toHaveTitle(this.title);
  }

  tabs = this.main.getByRole("tablist", { name: copy.tabs.title });

  topMusic = new TopMusicTab(this.page, this);
  recent = new RecentTab(this.page, this);

  get summary() {
    return this.main.getByRole("region", { name: copy.summary.title });
  }

  get summaryLoading() {
    return this.main.getByRole("progressbar", { name: copy.summary.loading });
  }

  get summaryError() {
    return this.main.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: copy.errors.summary }),
    });
  }

  get summaryRetry() {
    return this.summaryError
      .locator("..")
      .getByRole("button", { name: copy.errors.retry, exact: true });
  }

  get progressbars() {
    return this.main.getByRole("progressbar");
  }

  get alerts() {
    return this.main.getByRole("alert");
  }

  get retryButtons() {
    return this.main.getByRole("button", { name: copy.errors.retry, exact: true });
  }
}
