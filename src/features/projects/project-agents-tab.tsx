"use client";

import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectAgentList } from "./project-agent-list";
import { useProjects } from "./projects-context";

function ProjectAgentsTab({ projectId }: { projectId: string }) {
  const { projects } = useProjects();
  const project = projects.find((candidate) => candidate.id === projectId);

  if (!project) {
    return null;
  }

  return (
    <section aria-label="Project agents" className="space-y-4">
      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Agent involvement is demonstration data. This page does not create or
          modify agent assignments or controls.
        </AlertDescription>
      </Alert>
      <ProjectAgentList project={project} />
    </section>
  );
}

export { ProjectAgentsTab };
