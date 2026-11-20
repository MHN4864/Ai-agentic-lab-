"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { projectDemoData } from "./demo-data";
import type { ProjectFormValues, ProjectRecord } from "./types";

type ProjectsContextValue = {
  projects: ProjectRecord[];
  createProject: (values: ProjectFormValues) => ProjectRecord;
  updateProject: (
    projectId: string,
    values: ProjectFormValues,
  ) => ProjectRecord | undefined;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

function toOptionalValue(value: string) {
  return value.trim() || undefined;
}

function createProjectId(name: string, projects: ProjectRecord[]) {
  const slug = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const baseId = `project-${slug || "new"}`;
  let projectId = baseId;
  let suffix = 2;

  while (projects.some((project) => project.id === projectId)) {
    projectId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return projectId;
}

function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState(projectDemoData);

  const createProject = useCallback(
    (values: ProjectFormValues) => {
      const projectId = createProjectId(values.name, projects);
      const occurredAt = new Date().toISOString();
      const project: ProjectRecord = {
        id: projectId,
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        owner: toOptionalValue(values.owner),
        team: toOptionalValue(values.team),
        startDate: toOptionalValue(values.startDate),
        targetDate: toOptionalValue(values.targetDate),
        goals: toOptionalValue(values.goals),
        agentIds: [],
        taskSummary: null,
        workItems: [],
        activity: [
          {
            id: `${projectId}-created`,
            type: "created",
            description: "Project created in this demonstration",
            actor: "You",
            actorType: "human",
            occurredAt,
          },
        ],
      };

      setProjects((current) => [project, ...current]);
      return project;
    },
    [projects],
  );

  const updateProject = useCallback(
    (projectId: string, values: ProjectFormValues) => {
      const existing = projects.find((project) => project.id === projectId);

      if (!existing) {
        return undefined;
      }

      const statusChanged = existing.status !== values.status;
      const occurredAt = new Date().toISOString();
      const updatedProject: ProjectRecord = {
        ...existing,
        name: values.name.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        owner: toOptionalValue(values.owner),
        team: toOptionalValue(values.team),
        startDate: toOptionalValue(values.startDate),
        targetDate: toOptionalValue(values.targetDate),
        goals: toOptionalValue(values.goals),
        activity: [
          {
            id: `${projectId}-updated-${Date.now()}`,
            type: statusChanged ? "status" : "updated",
            description:
              statusChanged
                ? `Project status changed to ${values.status.replace("-", " ")}`
                : "Project details updated",
            actor: "You",
            actorType: "human",
            occurredAt,
          },
          ...existing.activity,
        ],
      };

      setProjects((current) =>
        current.map((project) =>
          project.id === projectId ? updatedProject : project,
        ),
      );
      return updatedProject;
    },
    [projects],
  );

  const value = useMemo(
    () => ({ projects, createProject, updateProject }),
    [projects, createProject, updateProject],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

function useProjects() {
  const context = useContext(ProjectsContext);

  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider.");
  }

  return context;
}

export { ProjectsProvider, useProjects };
