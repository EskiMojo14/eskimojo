import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/music/")({
  staticData: { title: "Music" },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
