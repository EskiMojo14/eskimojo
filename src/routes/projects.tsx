import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  staticData: { title: "Projects" },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  return null;
}
