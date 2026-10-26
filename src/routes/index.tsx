import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  staticData: { title: "Home" },
  component: Home,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function Home() {
  return null;
}
