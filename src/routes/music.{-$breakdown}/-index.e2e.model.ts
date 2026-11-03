import { expect, PageObjectModel, TabObjectModel } from "#test/e2e";

class TopMusicTab extends TabObjectModel<MusicPage> {
  url = "/music";
  tabName = "Top music";

  override matchesUrl(url: URL) {
    return url.pathname === this.url || url.pathname === "/music/top-music";
  }

  get periods() {
    return this.tabPanel.getByRole("group", { name: "Listening period" });
  }

  period(name: string) {
    return this.periods.getByRole("link", { name, exact: true });
  }

  get loading() {
    return this.tabPanel.getByRole("progressbar", { name: "Loading top music..." });
  }

  get topTracks() {
    return this.tabPanel.getByRole("heading", { name: "Top tracks", exact: true });
  }

  get topArtists() {
    return this.tabPanel.getByRole("heading", { name: "Top artists", exact: true });
  }

  get emptyState() {
    return this.tabPanel.getByText("No listening data for this period.");
  }

  get error() {
    return this.tabPanel.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: "Couldn't load top music" }),
    });
  }

  get retry() {
    return this.error.locator("..").getByRole("button", { name: "Retry", exact: true });
  }
}

class RecentTab extends TabObjectModel<MusicPage> {
  url = "/music/recent";
  tabName = "Recently played";

  get loading() {
    return this.tabPanel.getByRole("progressbar", { name: "Loading recent tracks..." });
  }

  get emptyState() {
    return this.tabPanel.getByRole("heading", { name: "No recently played tracks yet." });
  }

  track(name: string) {
    return this.tabPanel.getByText(name, { exact: true });
  }

  get error() {
    return this.tabPanel.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: "Couldn't load recent tracks" }),
    });
  }

  get refreshNotice() {
    return this.tabPanel.getByRole("status").filter({
      hasText: "Couldn't refresh recent tracks. Showing the last loaded results.",
    });
  }

  get refreshRetry() {
    return this.tabPanel.getByRole("button", { name: "Retry", exact: true });
  }
}

export class MusicPage extends PageObjectModel {
  url = "/music";
  title = /^Music/;

  get navLink() {
    return this.page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Music", exact: true });
  }

  /** Navigate to the music page from the current page using the primary navigation. */
  async navigate() {
    await this.navLink.click();
    await expect.page(this.page).toHaveURL((url) => this.matchesUrl(url));
    await expect.page(this.page).toHaveTitle(this.title);
  }

  tabs = this.main.getByRole("tablist", { name: "Music breakdown" });

  topMusic = new TopMusicTab(this.page, this);
  recent = new RecentTab(this.page, this);

  get summary() {
    return this.main.getByRole("region", { name: "Listening statistics" });
  }

  get summaryLoading() {
    return this.main.getByRole("progressbar", { name: "Loading listening summary..." });
  }

  get summaryError() {
    return this.main.getByRole("alert").filter({
      has: this.page.getByRole("heading", { name: "Couldn't load listening statistics" }),
    });
  }

  get summaryRetry() {
    return this.summaryError.locator("..").getByRole("button", { name: "Retry", exact: true });
  }

  get progressbars() {
    return this.main.getByRole("progressbar");
  }

  get alerts() {
    return this.main.getByRole("alert");
  }

  get retryButtons() {
    return this.main.getByRole("button", { name: "Retry", exact: true });
  }
}
