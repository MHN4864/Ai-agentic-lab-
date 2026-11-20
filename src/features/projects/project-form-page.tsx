"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjects } from "./projects-context";
import {
  projectPriorityLabels,
  projectStatusLabels,
} from "./project-labels";
import type {
  ProjectFormValues,
  ProjectPriority,
  ProjectStatus,
} from "./types";

const emptyValues: ProjectFormValues = {
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  owner: "",
  team: "",
  startDate: "",
  targetDate: "",
  goals: "",
};

function isProjectStatus(value: string): value is ProjectStatus {
  return value === "planning" || value === "active" || value === "on-hold" || value === "completed";
}

function isProjectPriority(value: string): value is ProjectPriority {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function ProjectFormPage({
  mode,
  projectId,
  embedded = false,
}: {
  mode: "create" | "edit";
  projectId?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const { projects, createProject, updateProject } = useProjects();
  const project = projectId
    ? projects.find((candidate) => candidate.id === projectId)
    : undefined;
  const [values, setValues] = useState<ProjectFormValues>(() =>
    project
      ? {
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          owner: project.owner ?? "",
          team: project.team ?? "",
          startDate: project.startDate ?? "",
          targetDate: project.targetDate ?? "",
          goals: project.goals ?? "",
        }
      : emptyValues,
  );
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  if (mode === "edit" && !project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project not found"
          description="This project is not available in the current demonstration data."
        />
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const cancelHref =
    mode === "edit" && projectId ? `/projects/${projectId}` : "/projects";

  function updateValue<Key extends keyof ProjectFormValues>(
    key: Key,
    value: ProjectFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setNameError("");
    setDateError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name.trim();

    if (!name) {
      setNameError("Enter a project name.");
      return;
    }

    setNameError("");

    if (
      values.startDate &&
      values.targetDate &&
      values.targetDate < values.startDate
    ) {
      setDateError("Target date must be on or after the start date.");
      return;
    }

    setDateError("");

    if (mode === "create") {
      const createdProject = createProject({ ...values, name });
      router.push(`/projects/${createdProject.id}`);
      return;
    }

    if (!projectId) {
      return;
    }

    const updatedProject = updateProject(projectId, { ...values, name });
    if (!updatedProject) {
      return;
    }

    router.push(`/projects/${updatedProject.id}`);
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <>
          <Link
            href={cancelHref}
            className="inline-flex min-h-8 items-center gap-2 rounded-sm text-control font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {mode === "edit" ? "Back to project" : "Back to Projects"}
          </Link>

          <PageHeader
            title={mode === "create" ? "Create Project" : "Edit Project"}
            description={
              mode === "create"
                ? "Set up an initiative for your organization."
                : "Update the initiative details for your organization."
            }
          />
        </>
      )}

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration only. Project changes remain in page memory and are not
          saved to a backend. Agent and task assignment are not available here.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-card-title font-medium leading-snug">
            Project information
          </h2>
          <p className="text-body text-muted-foreground">
            Add the initiative context your team needs. Only the project name
            is required.
          </p>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="project-name">
                  Project name <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="project-name"
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  required
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "project-name-error" : undefined}
                  placeholder="e.g. Agent reliability initiative"
                />
                {nameError && (
                  <p
                    id="project-name-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {nameError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={values.description}
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  placeholder="What outcome is this initiative working toward?"
                  rows={3}
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-status">Status</Label>
                <select
                  id="project-status"
                  value={values.status}
                  onChange={(event) => {
                    if (isProjectStatus(event.target.value)) {
                      updateValue("status", event.target.value);
                    }
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(projectStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-priority">Priority</Label>
                <select
                  id="project-priority"
                  value={values.priority}
                  onChange={(event) => {
                    if (isProjectPriority(event.target.value)) {
                      updateValue("priority", event.target.value);
                    }
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(projectPriorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-owner">Owner</Label>
                <Input
                  id="project-owner"
                  value={values.owner}
                  onChange={(event) => updateValue("owner", event.target.value)}
                  placeholder="Project owner"
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-team">Team</Label>
                <Input
                  id="project-team"
                  value={values.team}
                  onChange={(event) => updateValue("team", event.target.value)}
                  placeholder="Team or group"
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-start-date">Start date</Label>
                <Input
                  id="project-start-date"
                  type="date"
                  value={values.startDate}
                  onChange={(event) =>
                    updateValue("startDate", event.target.value)
                  }
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="project-target-date">Target date</Label>
                <Input
                  id="project-target-date"
                  type="date"
                  value={values.targetDate}
                  onChange={(event) =>
                    updateValue("targetDate", event.target.value)
                  }
                  aria-invalid={Boolean(dateError)}
                  aria-describedby={dateError ? "project-date-error" : undefined}
                />
                {dateError && (
                  <p
                    id="project-date-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {dateError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="project-goals">Goals and success criteria</Label>
                <Textarea
                  id="project-goals"
                  value={values.goals}
                  onChange={(event) => updateValue("goals", event.target.value)}
                  placeholder="What does success look like?"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Link
                href={cancelHref}
                className={buttonVariants({ variant: "outline" })}
              >
                Cancel
              </Link>
              <Button type="submit">
                {mode === "create" ? "Create Project" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { ProjectFormPage };
