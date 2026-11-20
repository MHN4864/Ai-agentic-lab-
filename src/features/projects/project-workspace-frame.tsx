"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  LayoutDashboard,
  ListChecks,
  Settings2,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectPriorityBadge, ProjectStatusBadge } from "./project-badges";
import { useProjects } from "./projects-context";

const projectTabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, suffix: "" },
  { id: "work", label: "Work", icon: ListChecks, suffix: "/work" },
  { id: "agents", label: "Agents", icon: Bot, suffix: "/agents" },
  { id: "activity", label: "Activity", icon: Activity, suffix: "/activity" },
  { id: "settings", label: "Settings", icon: Settings2, suffix: "/settings" },
] as const;

function ProjectWorkspaceFrame({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const { projects } = useProjects();
  const pathname = usePathname();
  const project = projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project is not available in the current demonstration data."
        icon={LayoutDashboard}
        action={
          <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft aria-hidden="true" />
            Back to Projects
          </Link>
        }
      />
    );
  }

  const projectPath = `/projects/${project.id}`;
  const activeTabId =
    pathname === projectPath
      ? "overview"
      : pathname.endsWith("/edit")
        ? "settings"
        : projectTabs.find(
              (tab) => tab.suffix && pathname === `${projectPath}${tab.suffix}`,
            )?.id ?? "overview";

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-control font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.description || "No description provided."}
        actions={
          <Link
            href={`${projectPath}/settings`}
            className={buttonVariants()}
          >
            <Settings2 aria-hidden="true" />
            Project settings
          </Link>
        }
      />

      <div
        aria-label="Project summary"
        className="flex flex-wrap items-center gap-2"
      >
        <ProjectStatusBadge status={project.status} />
        <ProjectPriorityBadge priority={project.priority} />
        <Badge variant="outline">
          Owner: {project.owner ?? "Unassigned"}
        </Badge>
      </div>

      <nav
        aria-label="Project workspace tabs"
        className="min-w-0 overflow-x-auto border-b border-border"
      >
        <ul className="flex min-w-max items-center gap-1">
          {projectTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTabId;

            return (
              <li key={tab.id}>
                <Link
                  href={`${projectPath}${tab.suffix}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-control font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

export { ProjectWorkspaceFrame };
