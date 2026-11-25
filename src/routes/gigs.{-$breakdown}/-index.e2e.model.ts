import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import { PageObjectModel, TabObjectModel } from "#test/e2e";

class MonthTab extends TabObjectModel<GigsPage> {
  url = "/gigs";
  tabName = copy.tabs.breakdown["by-month"].label;

  get region() {
    return this.tabPanel.getByRole("region", { name: copy.heatmapChart.title });
  }
}

class ArtistTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-artist";
  tabName = copy.tabs.breakdown["by-artist"].label;

  get region() {
    return this.tabPanel.getByRole("region", { name: copy.artistChart.title });
  }
}

class VenueTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-venue";
  tabName = copy.tabs.breakdown["by-venue"].label;

  get region() {
    return this.tabPanel.getByRole("region", { name: copy.venueChart.title });
  }
}

class CityTab extends TabObjectModel<GigsPage> {
  url = "/gigs/by-city";
  tabName = copy.tabs.breakdown["by-city"].label;

  get region() {
    return this.tabPanel.getByRole("region", { name: copy.cityChart.title });
  }

  get map() {
    return this.tabPanel.getByRole("img", { name: copy.cityChart.label });
  }
}

export class GigsPage extends PageObjectModel {
  url = "/gigs";
  title = /^Gigs/;

  tabs = this.main.getByRole("tablist", { name: copy.tabs.title });

  month = new MonthTab(this.page, this);
  artist = new ArtistTab(this.page, this);
  venue = new VenueTab(this.page, this);
  city = new CityTab(this.page, this);
}
