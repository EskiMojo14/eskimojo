import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  staticData: { title: "Projects" },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
