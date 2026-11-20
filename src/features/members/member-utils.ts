import type { MonitoringEvent } from "@/features/monitoring/types";
import type { ProjectRecord } from "@/features/projects/types";
import type { ReviewRecord } from "@/features/reviews/types";
import type { TaskAssignee, TaskRecord } from "@/features/tasks/types";
import type { WorkspaceMember } from "./types";

type MemberActivityItem = {
  id: string;
  label: string;
  description: string;
  occurredAt: string;
  href?: string;
};

function isHumanAssignee(
  assignee: TaskAssignee | null | undefined,
  memberId: string,
) {
  return assignee?.type === "human" && assignee.memberId === memberId;
}

function getMemberAssignedTasks(memberId: string, tasks: TaskRecord[]) {
  return tasks.filter(
    (task) =>
      isHumanAssignee(task.assignment.primaryAssignee, memberId) ||
      task.assignment.collaborators.some((assignee) =>
        isHumanAssignee(assignee, memberId),
      ),
  );
}

function getMemberOwnedProjects(
  member: WorkspaceMember,
  projects: ProjectRecord[],
) {
  const names = new Set([member.name, ...(member.previousNames ?? [])]);
  return projects.filter((project) => project.owner && names.has(project.owner));
}

function getMemberActivity(
  member: WorkspaceMember,
  tasks: TaskRecord[],
  projects: ProjectRecord[],
  reviews: ReviewRecord[],
  monitoringEvents: MonitoringEvent[],
): MemberActivityItem[] {
  const items: MemberActivityItem[] = [];
  const add = (item: MemberActivityItem) => {
    if (!Number.isNaN(new Date(item.occurredAt).getTime())) {
      items.push(item);
    }
  };

  for (const task of tasks) {
    for (const event of task.activity) {
      if (event.actor.type === "human" && event.actor.memberId === member.id) {
        add({
          id: event.id,
          label: "Task activity",
          description: `${task.title}: ${event.summary}`,
          occurredAt: event.occurredAt,
          href: `/tasks/${task.id}`,
        });
      }
    }
    for (const event of task.assignmentHistory) {
      if (event.actor.type === "human" && event.actor.memberId === member.id) {
        add({
          id: event.id,
          label: "Assignment update",
          description: `${task.title}: ${event.type.replaceAll("-", " ")}`,
          occurredAt: event.occurredAt,
          href: `/tasks/${task.id}`,
        });
      }
    }
  }

  for (const review of reviews) {
    for (const event of review.history) {
      if (
        event.actor.type === "human" &&
        event.actor.memberId === member.id
      ) {
        add({
          id: event.id,
          label: "Review activity",
          description: `${review.id}: ${event.type.replaceAll("-", " ")}`,
          occurredAt: event.occurredAt,
          href: `/reviews/${review.id}`,
        });
      }
    }
  }

  const memberNames = new Set([member.name, ...(member.previousNames ?? [])]);
  for (const project of projects) {
    for (const event of project.activity) {
      if (
        event.actorType === "human" &&
        memberNames.has(event.actor)
      ) {
        add({
          id: event.id,
          label: "Project activity",
          description: `${project.name}: ${event.description}`,
          occurredAt: event.occurredAt,
          href: `/projects/${project.id}`,
        });
      }
    }
  }

  for (const event of monitoringEvents) {
    if (event.actor.type !== "human" || event.actor.memberId !== member.id) {
      continue;
    }

    const href = event.taskId
      ? `/tasks/${event.taskId}`
      : event.projectId
        ? `/projects/${event.projectId}`
        : event.reviewId
          ? `/reviews/${event.reviewId}`
          : undefined;
    add({
      id: event.id,
      label: "Workforce activity",
      description: event.description,
      occurredAt: event.occurredAt,
      ...(href ? { href } : {}),
    });
  }

  return items.sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );
}

function formatMemberTimestamp(value?: string) {
  if (!value) {
    return "Not reported";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not reported";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export {
  formatMemberTimestamp,
  getMemberActivity,
  getMemberAssignedTasks,
  getMemberOwnedProjects,
};
export type { MemberActivityItem };
