import type { ProjectActivityEvent, ProjectRecord } from "./types";

function projectRequiresAttention(project: ProjectRecord) {
  return (
    project.status === "on-hold" ||
    (project.taskSummary?.blocked ?? 0) > 0
  );
}

function getProjectProgress(project: ProjectRecord) {
  if (!project.taskSummary) {
    return null;
  }

  if (project.taskSummary.total === 0) {
    return 0;
  }

  return Math.round(
    (project.taskSummary.completed / project.taskSummary.total) * 100,
  );
}

function formatProjectDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatActivityTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function sortProjectActivity(events: ProjectActivityEvent[]) {
  return [...events].sort((first, second) => {
    const firstTime = Date.parse(first.occurredAt);
    const secondTime = Date.parse(second.occurredAt);
    return (Number.isNaN(secondTime) ? 0 : secondTime) -
      (Number.isNaN(firstTime) ? 0 : firstTime);
  });
}

export {
  formatActivityTimestamp,
  formatProjectDate,
  getProjectProgress,
  projectRequiresAttention,
  sortProjectActivity,
};
