"use client";

import { useMemo, useState } from "react";
import { Activity, CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { ProjectActivityTimeline } from "./project-activity-timeline";
import { useProjects } from "./projects-context";
import type { ProjectActivityEvent } from "./types";

type ActivityFilter = "all" | ProjectActivityEvent["actorType"];

const actorTypeLabels: Record<ActivityFilter, string> = {
  all: "All activity",
  human: "Human activity",
  agent: "Agent activity",
  system: "System activity",
};

function isActivityFilter(value: string): value is ActivityFilter {
  return (
    value === "all" ||
    value === "human" ||
    value === "agent" ||
    value === "system"
  );
}

function ProjectActivityTab({ projectId }: { projectId: string }) {
  const { projects } = useProjects();
  const project = projects.find((candidate) => candidate.id === projectId);
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const filteredEvents = useMemo(
    () =>
      (project?.activity ?? []).filter(
        (event) => filter === "all" || event.actorType === filter,
      ),
    [filter, project?.activity],
  );

  if (!project) {
    return null;
  }

  return (
    <section aria-label="Project activity" className="space-y-4">
      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration activity only. Events are sample records and do not
          represent real-time collaboration.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Activity
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-card-title font-medium leading-snug">
                Project activity timeline
              </h2>
            </div>
            <Badge variant="outline">
              {filteredEvents.length} event
              {filteredEvents.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-body text-muted-foreground">
            Human, agent, and system events associated with this project.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="project-activity-filter">Filter activity</Label>
            <select
              id="project-activity-filter"
              value={filter}
              onChange={(event) => {
                if (isActivityFilter(event.target.value)) {
                  setFilter(event.target.value);
                }
              }}
              className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {Object.entries(actorTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {filteredEvents.length > 0 ? (
            <ProjectActivityTimeline events={filteredEvents} />
          ) : (
            <EmptyState
              title="No activity for this filter"
              description="Choose another activity type to view the sample events."
              icon={Activity}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export { ProjectActivityTab };
