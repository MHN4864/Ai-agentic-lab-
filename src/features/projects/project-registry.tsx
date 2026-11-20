"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpDown,
  CircleAlert,
  CircleCheck,
  FilterX,
  FolderKanban,
  Plus,
  Search,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useProjects } from "./projects-context";
import { ProjectPriorityBadge, ProjectStatusBadge } from "./project-badges";
import {
  projectPriorityLabels,
  projectStatusLabels,
} from "./project-labels";
import { formatProjectDate, getProjectProgress, projectRequiresAttention } from "./project-utils";
import type {
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
} from "./types";

type SortKey =
  | "name"
  | "status"
  | "priority"
  | "owner"
  | "team"
  | "agents"
  | "progress"
  | "startDate"
  | "targetDate";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

const unassignedValue = "__unassigned__";
const statusOrder: ProjectStatus[] = ["planning", "active", "on-hold", "completed"];
const priorityOrder: ProjectPriority[] = ["low", "medium", "high", "critical"];

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-metadata text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function projectSortValue(project: ProjectRecord, key: SortKey): string | number {
  switch (key) {
    case "name":
      return project.name;
    case "status":
      return statusOrder.indexOf(project.status);
    case "priority":
      return priorityOrder.indexOf(project.priority);
    case "owner":
      return project.owner ?? "";
    case "team":
      return project.team ?? "";
    case "agents":
      return project.agentIds.length;
    case "progress":
      return getProjectProgress(project) ?? -1;
    case "startDate":
      return project.startDate ?? "";
    case "targetDate":
      return project.targetDate ?? "";
  }
}

function compareProjects(
  first: ProjectRecord,
  second: ProjectRecord,
  sort: SortState,
) {
  const firstValue = projectSortValue(first, sort.key);
  const secondValue = projectSortValue(second, sort.key);
  let comparison: number;

  if (typeof firstValue === "number" && typeof secondValue === "number") {
    comparison = firstValue - secondValue;
  } else {
    const firstText = String(firstValue);
    const secondText = String(secondValue);
    if (!firstText || !secondText) {
      comparison = firstText ? -1 : secondText ? 1 : 0;
    } else {
      comparison = new Intl.Collator("en", {
        numeric: true,
        sensitivity: "base",
      }).compare(firstText, secondText);
    }
  }

  if (comparison === 0 && sort.key !== "name") {
    comparison = first.name.localeCompare(second.name);
  }

  return comparison * (sort.direction === "asc" ? 1 : -1);
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;

  return (
    <TableHead
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {label}
        <ArrowUpDown
          className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground"}`}
          aria-hidden="true"
        />
      </button>
    </TableHead>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  allLabel: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">{allLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProjectRegistry() {
  const router = useRouter();
  const { projects } = useProjects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [owner, setOwner] = useState("");
  const [sort, setSort] = useState<SortState>({
    key: "name",
    direction: "asc",
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (project) => project.status === "active",
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === "completed",
  ).length;
  const attentionProjects = projects.filter(projectRequiresAttention).length;
  const owners = [...new Set(projects.map((project) => project.owner ?? ""))].sort(
    (first, second) => first.localeCompare(second),
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return projects
      .filter((project) => {
        const matchesSearch =
          !normalizedQuery ||
          project.name.toLocaleLowerCase().includes(normalizedQuery) ||
          project.description.toLocaleLowerCase().includes(normalizedQuery);
        const matchesOwner =
          !owner ||
          (owner === unassignedValue
            ? !project.owner
            : project.owner === owner);

        return (
          matchesSearch &&
          (!status || project.status === status) &&
          (!priority || project.priority === priority) &&
          matchesOwner
        );
      })
      .sort((first, second) => compareProjects(first, second, sort));
  }, [owner, priority, projects, query, sort, status]);

  const hasFilters = Boolean(query || status || priority || owner);

  function clearFilters() {
    setQuery("");
    setStatus("");
    setPriority("");
    setOwner("");
  }

  function changeSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize initiatives that bring people and AI agents together."
        actions={
          <Link href="/projects/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Create Project
          </Link>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration data only. Project changes update this workspace in
          memory and are not saved to a backend.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Project summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Total projects"
          value={totalProjects}
          description="Projects in this workspace"
          icon={FolderKanban}
        />
        <MetricCard
          title="Active projects"
          value={activeProjects}
          description="Currently in active delivery"
          icon={CircleCheck}
        />
        <MetricCard
          title="Completed projects"
          value={completedProjects}
          description="Marked complete"
          icon={CircleCheck}
        />
        <MetricCard
          title="Requiring attention"
          value={attentionProjects}
          description="On hold or includes blocked tasks"
          icon={TriangleAlert}
        />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-card-title font-medium leading-snug">
                Project registry
              </h2>
              <p className="mt-1 text-body text-muted-foreground">
                Browse initiative status, ownership, team involvement, and
                task progress.
              </p>
            </div>
            <Badge variant="outline">
              {filteredProjects.length} of {totalProjects} projects
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(10rem,1fr))_auto] xl:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="project-search">Search projects</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="project-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or description"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="project-status-filter"
              label="Status"
              value={status}
              onChange={setStatus}
              options={Object.entries(projectStatusLabels) as [string, string][]}
              allLabel="All statuses"
            />
            <FilterSelect
              id="project-priority-filter"
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={
                Object.entries(projectPriorityLabels) as [string, string][]
              }
              allLabel="All priorities"
            />
            <FilterSelect
              id="project-owner-filter"
              label="Owner"
              value={owner}
              onChange={setOwner}
              options={[
                ...(owners.includes("")
                  ? [[unassignedValue, "Unassigned"] as [string, string]]
                  : []),
                ...owners
                  .filter(Boolean)
                  .map((ownerName) => [ownerName, ownerName] as [string, string]),
              ]}
              allLabel="All owners"
            />
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

          {filteredProjects.length > 0 ? (
            <Table aria-label="Projects" className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Project"
                    sortKey="name"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Status"
                    sortKey="status"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Priority"
                    sortKey="priority"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Owner"
                    sortKey="owner"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Team"
                    sortKey="team"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Agents"
                    sortKey="agents"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Tasks"
                    sortKey="progress"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Start date"
                    sortKey="startDate"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Target date"
                    sortKey="targetDate"
                    sort={sort}
                    onSort={changeSort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={(event) => {
                      if (
                        event.target instanceof Element &&
                        event.target.closest("a, button")
                      ) {
                        return;
                      }

                      router.push(`/projects/${project.id}`);
                    }}
                  >
                    <TableCell className="min-w-60 max-w-80">
                      <Link
                        href={`/projects/${project.id}`}
                        className="rounded-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                      >
                        {project.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-metadata text-muted-foreground">
                        {project.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      <ProjectPriorityBadge priority={project.priority} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {project.owner ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {project.team ?? (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {project.agentIds.length}
                    </TableCell>
                    <TableCell className="min-w-36">
                      {project.taskSummary ? (
                        <>
                          <span className="whitespace-nowrap tabular-nums">
                            {project.taskSummary.completed} /{" "}
                            {project.taskSummary.total}
                          </span>
                          <span className="text-metadata text-muted-foreground">
                            {" · "}
                            {getProjectProgress(project)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Not reported
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatProjectDate(project.startDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatProjectDate(project.targetDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={
                projects.length === 0
                  ? "No projects yet"
                  : "No projects match these filters"
              }
              description={
                projects.length === 0
                  ? "Create a project to organize an initiative for your team."
                  : "Try another search or clear the selected filters."
              }
              icon={FolderKanban}
              action={
                projects.length === 0 ? (
                  <Link href="/projects/new" className={buttonVariants()}>
                    <Plus aria-hidden="true" />
                    Create Project
                  </Link>
                ) : (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    <FilterX aria-hidden="true" />
                    Clear filters
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ProjectRegistry };
