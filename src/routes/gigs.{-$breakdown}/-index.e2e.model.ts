import { lazy } from "#/utils";
import { PageObjectModel, TabObjectModel } from "#test/e2e";

class MonthTab extends TabObjectModel<GigsPage> {
  url = "/gigs";
  tabName = "Month";

  @lazy
  get heading() {
    return this.tabPanel.getByRole("heading", { name: "Gigs by month and year" });
  }
}

class ArtistTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-artist";
  tabName = "Artist";

  @lazy
  get heading() {
    return this.tabPanel.getByRole("heading", { name: "Gigs by artist" });
  }
}

class VenueTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-venue";
  tabName = "Venue";

  @lazy
  get heading() {
    return this.tabPanel.getByRole("heading", { name: "Gigs by venue" });
  }
}

class CityTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-city";
  tabName = "City";

  @lazy
  get map() {
    return this.tabPanel.getByRole("img", { name: "Map of England" });
  }
}

export class GigsPage extends PageObjectModel {
  url = "/gigs";
  title = "Gigs";

  tabs = this.main.getByRole("tablist", { name: "Gigs breakdown" });

  month = new MonthTab(this.page, this);
  artist = new ArtistTab(this.page, this);
  venue = new VenueTab(this.page, this);
  city = new CityTab(this.page, this);
}
