"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  BadgeCheck,
  CircleAlert,
  Clock3,
  FilterX,
  Search,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useProjects } from "@/features/projects/projects-context";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { projectPriorityLabels } from "@/features/projects/project-labels";
import { ProjectPriorityBadge } from "@/features/projects/project-badges";
import { useTasks } from "@/features/tasks/tasks-context";
import { formatTaskTimestamp } from "@/features/tasks/task-utils";
import { ReviewStatusBadge } from "./review-badges";
import { ReviewPerson, reviewPersonName } from "./review-components";
import { reviewStatusLabels, submittedReviewStatuses } from "./labels";
import { useReviews } from "./reviews-context";
import type { ReviewRecord } from "./types";

type ReviewSortKey =
  | "task"
  | "project"
  | "submitter"
  | "reviewer"
  | "submittedAt"
  | "status"
  | "priority";

type SortState = {
  key: ReviewSortKey;
  direction: "asc" | "desc";
};

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
        <p className="mt-2 text-metadata text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
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

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: ReviewSortKey;
  sort: SortState;
  onSort: (key: ReviewSortKey) => void;
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

function sortableValue(
  review: ReviewRecord,
  key: ReviewSortKey,
  getTaskTitle: (review: ReviewRecord) => string,
  getProjectName: (review: ReviewRecord) => string,
  getPriority: (review: ReviewRecord) => string,
  getPersonName: (person: ReviewRecord["submitter"]) => string,
) {
  switch (key) {
    case "task":
      return getTaskTitle(review);
    case "project":
      return getProjectName(review);
    case "submitter":
      return getPersonName(review.submitter);
    case "reviewer":
      return getPersonName({
        type: "human",
        memberId: review.reviewerMemberId,
      });
    case "submittedAt":
      return review.submittedAt;
    case "status":
      return reviewStatusLabels[review.status];
    case "priority":
      return getPriority(review);
  }
}

function compareReviewValues(first: string, second: string) {
  return new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  }).compare(first, second);
}

function ReviewRegistry() {
  const router = useRouter();
  const { reviews } = useReviews();
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const getPersonName = useCallback(
    (person: ReviewRecord["submitter"]) => reviewPersonName(person, members),
    [members],
  );
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState<SortState>({
    key: "submittedAt",
    direction: "desc",
  });

  const relatedNames = useMemo(() => {
    const tasksById = new Map(tasks.map((task) => [task.id, task]));
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const getTask = (review: ReviewRecord) => tasksById.get(review.taskId);
    const getProject = (review: ReviewRecord) => {
      const task = getTask(review);
      return task ? projectsById.get(task.projectId) : undefined;
    };

    return {
      task: getTask,
      taskTitle: (review: ReviewRecord) =>
        getTask(review)?.title ?? "Task unavailable",
      projectName: (review: ReviewRecord) =>
        getProject(review)?.name ?? "Project unavailable",
      priority: (review: ReviewRecord) => getTask(review)?.priority ?? "",
    };
  }, [projects, tasks]);

  const latestReviewTimestamp = Math.max(
    0,
    ...reviews.map((review) => new Date(review.updatedAt).getTime()),
  );
  const recentlyApprovedCutoff =
    latestReviewTimestamp - 30 * 24 * 60 * 60 * 1000;

  const metrics = {
    pending: reviews.filter((review) => review.status === "awaiting-review")
      .length,
    inReview: reviews.filter((review) => review.status === "in-review").length,
    changesRequested: reviews.filter(
      (review) => review.status === "changes-requested",
    ).length,
    recentlyApproved: reviews.filter((review) => {
      if (review.status !== "approved") {
        return false;
      }

      const approval = review.history
        .filter((event) => event.type === "approved")
        .slice(-1)[0];
      return (
        approval !== undefined &&
        new Date(approval.occurredAt).getTime() >= recentlyApprovedCutoff &&
        new Date(approval.occurredAt).getTime() <= latestReviewTimestamp
      );
    }).length,
  };

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return reviews
      .filter((review) => {
        const task = relatedNames.task(review);
        const projectName = relatedNames.projectName(review);
        const matchesSearch =
          !normalizedQuery ||
          review.id.toLocaleLowerCase().includes(normalizedQuery) ||
          review.taskId.toLocaleLowerCase().includes(normalizedQuery) ||
          task?.title.toLocaleLowerCase().includes(normalizedQuery) ||
          projectName.toLocaleLowerCase().includes(normalizedQuery) ||
          getPersonName(review.submitter)
            .toLocaleLowerCase()
            .includes(normalizedQuery);

        return (
          matchesSearch &&
          (!projectId || task?.projectId === projectId) &&
          (!status || review.status === status) &&
          (!priority || task?.priority === priority)
        );
      })
      .sort((first, second) => {
        const firstValue = sortableValue(
          first,
          sort.key,
          relatedNames.taskTitle,
          relatedNames.projectName,
          relatedNames.priority,
          getPersonName,
        );
        const secondValue = sortableValue(
          second,
          sort.key,
          relatedNames.taskTitle,
          relatedNames.projectName,
          relatedNames.priority,
          getPersonName,
        );
        const comparison =
          sort.key === "submittedAt"
            ? new Date(firstValue).getTime() - new Date(secondValue).getTime()
            : compareReviewValues(firstValue, secondValue);
        return comparison * (sort.direction === "asc" ? 1 : -1);
      });
  }, [getPersonName, priority, projectId, query, relatedNames, reviews, sort, status]);

  const hasFilters = Boolean(query || projectId || status || priority);

  function changeSort(key: ReviewSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function openReview(reviewId: string) {
    router.push(`/reviews/${reviewId}`);
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    reviewId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openReview(reviewId);
    }
  }

  function clearFilters() {
    setQuery("");
    setProjectId("");
    setStatus("");
    setPriority("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human reviews"
        description="Review submitted deliverables and record a human decision."
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Review records and decisions are demonstration-only. Reviewer
          responsibility is shown for clarity; no authorization is enforced.
        </AlertDescription>
      </Alert>

      <section
        aria-label="Review queue summary"
        className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Pending review"
          value={metrics.pending}
          description="Awaiting a human reviewer"
          icon={Clock3}
        />
        <MetricCard
          title="In review"
          value={metrics.inReview}
          description="A reviewer has started"
          icon={Search}
        />
        <MetricCard
          title="Changes requested"
          value={metrics.changesRequested}
          description="Returned for more work"
          icon={TriangleAlert}
        />
        <MetricCard
          title="Recently approved"
          value={metrics.recentlyApproved}
          description="Within 30 days of the latest demo review"
          icon={BadgeCheck}
        />
      </section>

      <Card className="min-w-0">
        <CardContent className="space-y-4 p-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(10rem,1fr))_auto] xl:items-end">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="review-search">Search reviews</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="review-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Task, review ID, project, or submitter"
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              id="review-project-filter"
              label="Project"
              value={projectId}
              onChange={setProjectId}
              options={projects.map(
                (project) => [project.id, project.name] as [string, string],
              )}
              allLabel="All projects"
            />
            <FilterSelect
              id="review-status-filter"
              label="Review status"
              value={status}
              onChange={setStatus}
              options={submittedReviewStatuses.map(
                (value) => [value, reviewStatusLabels[value]] as [string, string],
              )}
              allLabel="All review statuses"
            />
            <FilterSelect
              id="review-priority-filter"
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={Object.entries(projectPriorityLabels) as [string, string][]}
              allLabel="All priorities"
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

          <div
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <p className="text-metadata text-muted-foreground">
              {filteredReviews.length} of {reviews.length} review
              {reviews.length === 1 ? "" : "s"}
            </p>
            <p className="text-metadata text-muted-foreground">
              Sortable by task, project, submitter, reviewer, submission date,
              status, and priority.
            </p>
          </div>

          {filteredReviews.length ? (
            <Table className="min-w-[1120px]">
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Task"
                    sortKey="task"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Project"
                    sortKey="project"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Submitted by"
                    sortKey="submitter"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Reviewer"
                    sortKey="reviewer"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Submitted"
                    sortKey="submittedAt"
                    sort={sort}
                    onSort={changeSort}
                  />
                  <SortableHead
                    label="Review status"
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => {
                  const task = relatedNames.task(review);
                  return (
                    <TableRow
                      key={review.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open review ${review.id}: ${relatedNames.taskTitle(review)}`}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                      onClick={() => openReview(review.id)}
                      onKeyDown={(event) =>
                        handleRowKeyDown(event, review.id)
                      }
                    >
                      <TableCell className="min-w-60">
                        <p className="font-medium text-foreground">
                          {relatedNames.taskTitle(review)}
                        </p>
                        <p className="mt-1 font-mono text-metadata text-muted-foreground">
                          {review.taskId} · {review.id}
                        </p>
                      </TableCell>
                      <TableCell>{relatedNames.projectName(review)}</TableCell>
                      <TableCell>
                        <ReviewPerson person={review.submitter} role="Submitter" />
                      </TableCell>
                      <TableCell>
                        <ReviewPerson
                          person={{
                            type: "human",
                            memberId: review.reviewerMemberId,
                          }}
                          role="Reviewer"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTaskTimestamp(review.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <ReviewStatusBadge status={review.status} />
                      </TableCell>
                      <TableCell>
                        {task ? (
                          <ProjectPriorityBadge
                            priority={task.priority}
                            category="Task priority"
                          />
                        ) : (
                          "Not reported"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : reviews.length ? (
            <EmptyState
              title="No reviews match these filters"
              description="Try a different search or clear the selected filters."
              icon={FilterX}
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No deliverables submitted"
              description="Submit a demonstration deliverable from a task to create its first review record."
              icon={CircleAlert}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { ReviewRegistry };
