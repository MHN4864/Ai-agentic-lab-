import type {
  TaskActivityActor,
  TaskAssignment,
  TaskAssignmentHistoryEvent,
  TaskAssignee,
  TaskRecord,
} from "./types";

function assigneeKey(assignee: TaskAssignee) {
  return assignee.type === "human"
    ? `human:${assignee.memberId}`
    : `agent:${assignee.agentId}`;
}

function sameAssignee(
  first: TaskAssignee | null,
  second: TaskAssignee | null,
) {
  return first === null
    ? second === null
    : second !== null && assigneeKey(first) === assigneeKey(second);
}

function createAssignmentHistoryEvents(
  taskId: string,
  previous: TaskAssignment,
  next: TaskAssignment,
  occurredAt: string,
  actor: TaskActivityActor,
): TaskAssignmentHistoryEvent[] {
  const events: TaskAssignmentHistoryEvent[] = [];
  let eventIndex = 0;
  let currentPrimary = previous.primaryAssignee;

  function addEvent(
    type: TaskAssignmentHistoryEvent["type"],
    previousPrimaryAssignee: TaskAssignee | null,
    newPrimaryAssignee: TaskAssignee | null,
    collaborator?: TaskAssignee,
  ) {
    events.push({
      id: `${taskId}-assignment-${Date.parse(occurredAt)}-${eventIndex}`,
      type,
      actor,
      previousPrimaryAssignee,
      newPrimaryAssignee,
      ...(collaborator ? { collaborator } : {}),
      occurredAt,
    });
    eventIndex += 1;
  }

  if (!sameAssignee(previous.primaryAssignee, next.primaryAssignee)) {
    const type = !previous.primaryAssignee
      ? "initial-assignment"
      : !next.primaryAssignee
        ? "unassignment"
        : "reassignment";
    addEvent(type, currentPrimary, next.primaryAssignee);
    currentPrimary = next.primaryAssignee;
  }

  const nextCollaborators = new Set(
    next.collaborators.map((assignee) => assigneeKey(assignee)),
  );
  const previousCollaborators = new Set(
    previous.collaborators.map((assignee) => assigneeKey(assignee)),
  );

  for (const collaborator of previous.collaborators) {
    if (!nextCollaborators.has(assigneeKey(collaborator))) {
      addEvent(
        "collaborator-removed",
        currentPrimary,
        currentPrimary,
        collaborator,
      );
    }
  }

  for (const collaborator of next.collaborators) {
    if (!previousCollaborators.has(assigneeKey(collaborator))) {
      addEvent(
        "collaborator-added",
        currentPrimary,
        currentPrimary,
        collaborator,
      );
    }
  }

  return events;
}

function getAssignmentHistoryActor(): TaskActivityActor {
  return { type: "system", label: "You" };
}

function nextTaskRecordWithAssignment(
  existing: TaskRecord,
  assignment: TaskAssignment,
  occurredAt: string,
) {
  const assignmentHistory = createAssignmentHistoryEvents(
    existing.id,
    existing.assignment,
    assignment,
    occurredAt,
    getAssignmentHistoryActor(),
  );

  return {
    ...existing,
    assignment,
    assignmentHistory: [...assignmentHistory, ...existing.assignmentHistory],
    updatedAt: assignmentHistory.length ? occurredAt : existing.updatedAt,
  };
}

export {
  assigneeKey,
  createAssignmentHistoryEvents,
  getAssignmentHistoryActor,
  nextTaskRecordWithAssignment,
  sameAssignee,
};
