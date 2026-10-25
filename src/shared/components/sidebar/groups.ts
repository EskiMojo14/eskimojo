import { linkOptions } from "@tanstack/react-router";

export const links = [
  { key: "home", children: [{ ...linkOptions({ to: "/" }), label: "Home", icon: "home" }] },
  {
    key: "projects",
    children: [{ ...linkOptions({ to: "/projects" }), label: "Projects", icon: "folder" }],
  },
  {
    key: "music-gigs",
    children: [
      { ...linkOptions({ to: "/music" }), label: "Music", icon: "headphones" },
      {
        ...linkOptions({ to: "/gigs/{-$breakdown}", params: { breakdown: undefined } }),
        label: "Gigs",
        icon: "event_seat",
      },
    ],
  },
] satisfies Array<{
  key: string;
  children: Array<{ to: string; label: string; icon: string }>;
}>;
