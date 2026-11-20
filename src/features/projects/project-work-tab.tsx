"use client";

import { useMemo, useState } from "react";
import {
  CircleAlert,
  FilterX,
  ListTodo,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agentDemoData } from "@/features/agents/demo-data";
import { useProjects } from "./projects-context";
import {
  ProjectPriorityBadge,
  WorkStatusBadge,
} from "./project-badges";
import { workStatusLabels } from "./project-labels";
import { formatProjectDate } from "./project-utils";
import type { ProjectWorkAssignee, ProjectWorkStatus } from "./types";

function isProjectWorkStatus(value: string): value is ProjectWorkStatus {
  return (
    value === "open" ||
    value === "in-progress" ||
    value === "awaiting-review" ||
    value === "blocked" ||
    value === "completed"
  );
}

function WorkStatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor="work-status-filter">Status</Label>
      <select
        id="work-status-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">All statuses</option>
        {Object.entries(workStatusLabels).map(([status, label]) => (
          <option key={status} value={status}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function WorkAssignment({
  assignment,
}: {
  assignment: ProjectWorkAssignee;
}) {
  if (assignment.type === "human") {
    return <span>{assignment.name}</span>;
  }

  const agent = agentDemoData.find(
    (candidate) => candidate.id === assignment.agentId,
  );

  return agent ? (
    <span>
      {agent.name}
      <span className="mt-0.5 block text-metadata text-muted-foreground">
        Agent
      </span>
    </span>
  ) : (
    <span className="text-muted-foreground">Agent not reported</span>
  );
}

function ProjectWorkTab({ projectId }: { projectId: string }) {
  const { projects } = useProjects();
  const project = projects.find((candidate) => candidate.id === projectId);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return (project?.workItems ?? []).filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLocaleLowerCase().includes(normalizedQuery) ||
        item.description.toLocaleLowerCase().includes(normalizedQuery);
      return matchesQuery && (!status || item.status === status);
    });
  }, [project?.workItems, query, status]);

  if (!project) {
    return null;
  }

  const hasFilters = Boolean(query || status);
  function clearFilters() {
    setQuery("");
    setStatus("");
  }

  function changeStatus(value: string) {
    setStatus(isProjectWorkStatus(value) ? value : "");
  }

  return (
    <section aria-label="Project work" className="space-y-4">
      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Illustrative work items only. These are not live tasks; assignment,
          execution, and workflow actions are not available.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ListTodo
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-card-title font-medium leading-snug">
                Project work overview
              </h2>
            </div>
            <Badge variant="outline">
              {filteredItems.length} of {project.workItems.length} work items
            </Badge>
          </div>
          <p className="text-body text-muted-foreground">
            A read-only view of sample work associated with this project.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,0.7fr)_auto] sm:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="work-search">Search work items</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="work-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Title or description"
                  className="pl-9"
                />
              </div>
            </div>
            <WorkStatusFilter value={status} onChange={changeStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="w-full sm:w-fit"
            >
              <FilterX aria-hidden="true" />
              Clear filters
            </Button>
          </div>

          {filteredItems.length > 0 ? (
            <Table
              aria-label="Project work items"
              className="min-w-[850px]"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Work item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Due date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-64 max-w-96">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 whitespace-normal text-metadata text-muted-foreground">
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <WorkStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <ProjectPriorityBadge
                        priority={item.priority}
                        category="Work item priority"
                      />
                    </TableCell>
                    <TableCell className="min-w-40">
                      <WorkAssignment assignment={item.assignee} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatProjectDate(item.dueDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : project.workItems.length === 0 ? (
            <EmptyState
              title="No work items in this sample"
              description="This project has no illustrative work items. Work management is not part of this step."
              icon={ListTodo}
            />
          ) : (
            <EmptyState
              title="No work items match these filters"
              description="Try a different search or clear the selected filters."
              icon={ListTodo}
              action={
                <Button type="button" variant="outline" onClick={clearFilters}>
                  <FilterX aria-hidden="true" />
                  Clear filters
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export { ProjectWorkTab };
