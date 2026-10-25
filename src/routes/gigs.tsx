import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gigs")({
  staticData: { title: "Gigs" },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
