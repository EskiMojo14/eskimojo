import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/music")({
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
