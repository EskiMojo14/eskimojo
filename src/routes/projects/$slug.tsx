import { createFileRoute, linkOptions } from "@tanstack/react-router";

import { ProjectDetail } from "#/routes/projects/-components/project-detail";
import { generatePageMetadata } from "#/shared/lib/document-head";

import { getProject } from "./-data";
import { getProjectContent } from "./-mdx";

import styles from "#/routes/projects/-components/project-detail/index.css?url";

const backLink = linkOptions({
  to: "/projects",
});

export const Route = createFileRoute("/projects/$slug")({
  staticData: {
    title: "Projects",
    backLink: {
      ...backLink,
      label: "Back to projects",
    },
  },
  loader: async ({ params: { slug } }) => {
    const project = getProject(slug);
    await getProjectContent(project.filePath).preload?.();
    return project;
  },
  head: ({ loaderData }) => {
    const metadata = generatePageMetadata({
      title: loaderData?.title ?? "Project",
      description: loaderData?.summary ?? "Explore eskimojo's projects and contributions.",
      image: loaderData?.logo?.light
        ? {
            url: loaderData.logo.social ?? loaderData.logo.light,
            alt: `${loaderData.title} logo`,
          }
        : undefined,
    });
    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: styles }],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const project = Route.useLoaderData();
  const Content = getProjectContent(project.filePath);
  return (
    <main className="projects-page">
      <ProjectDetail project={project}>
        {/* oxlint-disable-next-line react/static-components -- Lookup returns a stable, module-level lazy component; it does not create one. */}
        <Content />
      </ProjectDetail>
    </main>
  );
}
