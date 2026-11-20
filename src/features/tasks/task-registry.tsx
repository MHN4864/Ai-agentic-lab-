"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpDown,
  Bot,
  CircleAlert,
  CircleCheck,
  FilterX,
  ListTodo,
  Plus,
  Search,
  UserRound,
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
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { useProjects } from "@/features/projects/projects-context";
import { projectPriorityLabels } from "@/features/projects/project-labels";
import { ProjectPriorityBadge } from "@/features/projects/project-badges";
import { useTasks } from "./tasks-context";
import { AssigneeTypeBadge, TaskStatusBadge, TaskTypeBadge } from "./task-badges";
import { taskStatusLabels, taskTypeLabels } from "./labels";
import {
  formatTaskDate,
  sortTasks,
  taskAssigneeLabel,
  type TaskSortKey,
} from "./task-utils";
import type { TaskAssignee, TaskRecord } from "./types";

type SortState = {
  key: TaskSortKey;
  direction: "asc" | "desc";
};

const unassignedFilter = "unassigned";

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

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: TaskSortKey;
  sort: SortState;
  onSort: (key: TaskSortKey) => void;
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

function taskAssigneeFilterValue(assignee: TaskAssignee | null) {
  if (!assignee) {
    return unassignedFilter;
  }

  return assignee.type === "human"
    ? `human:${assignee.memberId}`
    : `agent:${assignee.agentId}`;
}

function taskMatchesAssignee(task: TaskRecord, filterValue: string) {
  if (filterValue === unassignedFilter) {
    return task.assignment.primaryAssignee === null;
  }

  return (
    taskAssigneeFilterValue(task.assignment.primaryAssignee) === filterValue ||
    task.assignment.collaborators.some(
      (collaborator) => taskAssigneeFilterValue(collaborator) === filterValue,
    )
  );
}

function assigneeFilterOptions(
  members: ReturnType<typeof useWorkforceDirectory>["members"],
) {
  return [
    ...members.map(
      (member) =>
        [`human:${member.id}`, `${member.name} (Human)`] as [string, string],
    ),
    ...agentDemoData.map(
      (agent) =>
        [`agent:${agent.id}`, `${agent.name} (Agent)`] as [string, string],
    ),
  ].sort((first, second) => first[1].localeCompare(second[1]));
}

function TaskRegistry() {
  const router = useRouter();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [taskType, setTaskType] = useState("");
  const [sort, setSort] = useState<SortState>({
    key: "updatedAt",
    direction: "desc",
  });

  const metrics = {
    total: tasks.length,
    open: tasks.filter((task) =>
      ["backlog", "ready", "waiting"].includes(task.status),
    ).length,
    inProgress: tasks.filter((task) => task.status === "in-progress").length,
    blocked: tasks.filter((task) => task.status === "blocked").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    inReview: tasks.filter((task) => task.status === "in-review").length,
  };

  const relatedNames = useMemo(
    () => ({
      projectName: (task: TaskRecord) =>
        projects.find((project) => project.id === task.projectId)?.name ??
        "Project unavailable",
      assigneeName: (task: TaskRecord) =>
        taskAssigneeLabel(task.assignment.primaryAssignee, members),
    }),
    [members, projects],
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tasks
      .filter((task) => {
        const matchesSearch =
          !normalizedQuery ||
          task.title.toLocaleLowerCase().includes(normalizedQuery) ||
          task.id.toLocaleLowerCase().includes(normalizedQuery) ||
          task.description.toLocaleLowerCase().includes(normalizedQuery);

        return (
          matchesSearch &&
          (!projectId || task.projectId === projectId) &&
          (!status || task.status === status) &&
          (!priority || task.priority === priority) &&
          (!assignee || taskMatchesAssignee(task, assignee)) &&
          (!taskType || task.taskType === taskType)
        );
      })
      .sort((first, second) => {
        const comparison = sortTasks(
          first,
          second,
          sort.key,
          sort.direction,
          (task) => ({
            projectName: relatedNames.projectName(task),
            assigneeName: relatedNames.assigneeName(task),
          }),
        );

        return comparison || first.id.localeCompare(second.id);
      });
  }, [
    assignee,
    priority,
    projectId,
    query,
    relatedNames,
    sort,
    status,
    taskType,
    tasks,
  ]);

  const hasFilters = Boolean(
    query || projectId || status || priority || assignee || taskType,
  );

  function clearFilters() {
    setQuery("");
    setProjectId("");
    setStatus("");
    setPriority("");
    setAssignee("");
    setTaskType("");
  }

  function changeSort(key: TaskSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function openTask(taskId: string) {
    router.push(`/tasks/${taskId}`);
  }

  function onTaskRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, taskId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTask(taskId);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Coordinate work across projects, people, and AI agents."
        actions={
          <Link href="/tasks/new" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Create Task
          </Link>
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration data only. Task updates stay in workspace memory and
          are not saved to a backend. No agent work is started from this page.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Task summary"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
      >
        <MetricCard
          title="Total tasks"
          value={metrics.total}
          description="Across all projects"
          icon={ListTodo}
        />
        <MetricCard
          title="Open tasks"
          value={metrics.open}
          description="Backlog, Ready, and Waiting"
          icon={CircleAlert}
        />
        <MetricCard
          title="In progress"
          value={metrics.inProgress}
          description="Marked In Progress"
          icon={CircleCheck}
        />
        <MetricCard
          title="Blocked"
          value={metrics.blocked}
          description="Needs follow-up"
          icon={TriangleAlert}
        />
        <MetricCard
          title="Completed"
          value={metrics.completed}
          description="Marked Completed"
          icon={CircleCheck}
        />
        <MetricCard
          title="Awaiting review"
          value={metrics.inReview}
          description="Marked In Review"
          icon={UserRound}
        />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-card-title font-medium leading-snug">
                Task registry
              </h2>
              <p className="mt-1 text-body text-muted-foreground">
                Task status is separate from the operational state of an
                assigned agent.
              </p>
            </div>
            <Badge variant="outline">
              {filteredTasks.length} of {tasks.length} tasks
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.4fr)_repeat(5,minmax(9rem,1fr))_auto] xl:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="task-search">Search tasks</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="task-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Title, ID, or description"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="task-project-filter"
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map(
                (project) => [project.id, project.name] as [string, string],
              )}
              allLabel="All projects"
            />
            <FilterSelect
              id="task-status-filter"
              label="Status"
              value={status}
              onChange={setStatus}
              options={Object.entries(taskStatusLabels) as [string, string][]}
              allLabel="All statuses"
            />
            <FilterSelect
              id="task-priority-filter"
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={
                Object.entries(projectPriorityLabels) as [string, string][]
              }
              allLabel="All priorities"
            />
            <FilterSelect
              id="task-assignee-filter"
              label="Assignee"
              value={assignee}
              onChange={setAssignee}
              options={[
                ...(tasks.some(
                  (task) => !task.assignment.primaryAssignee,
                )
                  ? [[unassignedFilter, "Unassigned"] as [string, string]]
                  : []),
                ...assigneeFilterOptions(members),
              ]}
              allLabel="All assignees"
            />
            <FilterSelect
              id="task-type-filter"
              label="Task type"
              value={taskType}
              onChange={setTaskType}
              options={Object.entries(taskTypeLabels) as [string, string][]}
              allLabel="All types"
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

          {filteredTasks.length ? (
            <Table aria-label="Task registry" className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Task"
                    sortKey="title"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <TableHead>Task ID</TableHead>
                  <SortableHead
                    label="Project"
                    sortKey="project"
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
                    label="Primary assignee"
                    sortKey="assignee"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Collaborators"
                    sortKey="collaborators"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Type"
                    sortKey="taskType"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Due date"
                    sortKey="dueDate"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Last updated"
                    sortKey="updatedAt"
                    sort={sort}
                    onSort={changeSort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const project = projects.find(
                    (candidate) => candidate.id === task.projectId,
                  );
                  const primaryAssignee =
                    task.assignment.primaryAssignee;
                  const AssigneeIcon =
                    primaryAssignee?.type === "agent" ? Bot : UserRound;

                  return (
                    <TableRow
                      key={task.id}
                      tabIndex={0}
                      aria-label={`Open task ${task.id}: ${task.title}`}
                      className="cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]"
                      onClick={() => openTask(task.id)}
                      onKeyDown={(event) => onTaskRowKeyDown(event, task.id)}
                    >
                      <TableCell className="min-w-56">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {task.title}
                          </p>
                          <p className="mt-0.5 max-w-sm truncate text-metadata text-muted-foreground">
                            {task.description || "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-metadata">
                        {task.id}
                      </TableCell>
                      <TableCell className="max-w-48">
                        <span className="block truncate">
                          {project?.name ?? "Project unavailable"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <ProjectPriorityBadge
                          priority={task.priority}
                          category="Task priority"
                        />
                      </TableCell>
                      <TableCell>
                        {primaryAssignee ? (
                          <div className="flex min-w-40 items-center gap-2">
                            <AssigneeIcon
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 truncate">
                              {taskAssigneeLabel(primaryAssignee, members)}
                            </span>
                            <AssigneeTypeBadge type={primaryAssignee.type} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {task.assignment.collaborators.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TaskTypeBadge taskType={task.taskType} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTaskDate(task.dueDate)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatTaskDate(task.updatedAt.slice(0, 10))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title={tasks.length ? "No tasks match these filters" : "No tasks yet"}
              description={
                tasks.length
                  ? "Try a different search or clear the selected filters."
                  : "Create a task to coordinate work in a project."
              }
              icon={ListTodo}
              action={
                tasks.length ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <FilterX aria-hidden="true" />
                    Clear filters
                  </Button>
                ) : (
                  <Link href="/tasks/new" className={buttonVariants()}>
                    <Plus aria-hidden="true" />
                    Create Task
                  </Link>
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { TaskRegistry };
