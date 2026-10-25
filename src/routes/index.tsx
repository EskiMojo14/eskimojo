import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  staticData: { title: "Home" },
  component: Home,
});

function Home() {
  return null;
}
