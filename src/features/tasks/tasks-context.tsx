"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import type { WorkspaceMember } from "@/features/members/types";
import { useProjects } from "@/features/projects/projects-context";
import {
  assigneeKey,
  createAssignmentHistoryEvents,
  getAssignmentHistoryActor,
  nextTaskRecordWithAssignment,
  sameAssignee,
} from "./task-assignment-utils";
import { taskDemoData } from "./demo-data";
import type {
  TaskAssignment,
  TaskAssignee,
  TaskFormValues,
  TaskRecord,
  TaskStatus,
  TaskType,
} from "./types";

type TasksContextValue = {
  tasks: TaskRecord[];
  createTask: (values: TaskFormValues) => TaskRecord | undefined;
  updateTask: (
    taskId: string,
    values: TaskFormValues,
  ) => TaskRecord | undefined;
  updateTaskAssignment: (
    taskId: string,
    assignment: TaskAssignment,
  ) => TaskRecord | undefined;
  updateTaskFromReview: (
    taskId: string,
    status: TaskStatus,
    summary: string,
  ) => TaskRecord | undefined;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function isValidAssignee(
  assignee: TaskAssignee | null,
  taskType: TaskType,
  members: WorkspaceMember[],
) {
  if (!assignee) {
    return true;
  }

  if (taskType === "human" && assignee.type !== "human") {
    return false;
  }

  if (taskType === "agent" && assignee.type !== "agent") {
    return false;
  }

  return assignee.type === "human"
    ? members.some((member) => member.id === assignee.memberId)
    : agentDemoData.some((agent) => agent.id === assignee.agentId);
}

function isValidAssignment(
  assignment: TaskAssignment,
  taskType: TaskType,
  members: WorkspaceMember[],
) {
  if (!isValidAssignee(assignment.primaryAssignee, taskType, members)) {
    return false;
  }

  if (
    assignment.collaborators.length &&
    (taskType !== "collaborative" || !assignment.primaryAssignee)
  ) {
    return false;
  }

  const assigneeKeys = new Set<string>();
  const assignees = [
    ...(assignment.primaryAssignee ? [assignment.primaryAssignee] : []),
    ...assignment.collaborators,
  ];

  for (const assignee of assignees) {
    const key = assigneeKey(assignee);
    if (
      !isValidAssignee(assignee, "collaborative", members) ||
      assigneeKeys.has(key)
    ) {
      return false;
    }

    assigneeKeys.add(key);
  }

  return true;
}

function getNextTaskNumber(tasks: TaskRecord[]) {
  return (
    Math.max(
      0,
      ...tasks.map((task) => Number(task.id.replace(/^TASK-/, "")) || 0),
    ) + 1
  );
}

function normalizeTaskValues(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    projectId: values.projectId,
    status: values.status,
    priority: values.priority,
    taskType: values.taskType,
    dueDate: values.dueDate || undefined,
    acceptanceCriteria: values.acceptanceCriteria.trim(),
    context: values.context.trim(),
  };
}

function TasksProvider({ children }: { children: ReactNode }) {
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const [tasks, setTasks] = useState(taskDemoData);
  const nextTaskNumber = useRef(getNextTaskNumber(taskDemoData));

  const createTask = useCallback(
    (values: TaskFormValues) => {
      const assignment: TaskAssignment = {
        primaryAssignee: values.primaryAssignee,
        collaborators: [],
      };
      if (
        !projects.some((project) => project.id === values.projectId) ||
        !isValidAssignment(assignment, values.taskType, members)
      ) {
        return undefined;
      }

      const occurredAt = new Date().toISOString();
      const id = `TASK-${nextTaskNumber.current}`;
      nextTaskNumber.current += 1;
      const normalizedValues = normalizeTaskValues(values);
      const assignmentHistory = createAssignmentHistoryEvents(
        id,
        { primaryAssignee: null, collaborators: [] },
        assignment,
        occurredAt,
        getAssignmentHistoryActor(),
      );
      const task: TaskRecord = {
        ...normalizedValues,
        id,
        assignment,
        assignmentHistory,
        createdAt: occurredAt,
        updatedAt: occurredAt,
        activity: [
          {
            id: `${id}-created`,
            type: "created",
            actor: { type: "system", label: "You" },
            summary: "Task created in this demonstration workspace",
            occurredAt,
          },
        ],
      };

      setTasks((current) => [task, ...current]);
      return task;
    },
    [members, projects],
  );

  const updateTask = useCallback(
    (taskId: string, values: TaskFormValues) => {
      const existing = tasks.find((task) => task.id === taskId);
      const assignment: TaskAssignment = {
        primaryAssignee: values.primaryAssignee,
        collaborators:
          values.taskType === "collaborative" && values.primaryAssignee
            ? (existing?.assignment.collaborators ?? []).filter(
                (collaborator) =>
                  !sameAssignee(collaborator, values.primaryAssignee),
              )
            : [],
      };
      if (
        !existing ||
        !projects.some((project) => project.id === values.projectId) ||
        !isValidAssignment(assignment, values.taskType, members)
      ) {
        return undefined;
      }

      const occurredAt = new Date().toISOString();
      const statusChanged = existing.status !== values.status;
      const normalizedValues = normalizeTaskValues(values);
      const taskWithAssignment = nextTaskRecordWithAssignment(
        {
          ...existing,
          ...normalizedValues,
          updatedAt: occurredAt,
        },
        assignment,
        occurredAt,
      );
      const updatedTask: TaskRecord = {
        ...taskWithAssignment,
        activity: [
          {
            id: `${taskId}-updated-${Date.now()}`,
            type: statusChanged ? "status" : "updated",
            actor: { type: "system", label: "You" },
            summary: statusChanged
              ? `Task status changed to ${values.status.replace("-", " ")}`
              : "Task details updated",
            occurredAt,
          },
          ...existing.activity,
        ],
      };

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      return updatedTask;
    },
    [members, projects, tasks],
  );

  const updateTaskAssignment = useCallback(
    (taskId: string, assignment: TaskAssignment) => {
      const existing = tasks.find((task) => task.id === taskId);
      if (
        !existing ||
        !isValidAssignment(assignment, existing.taskType, members)
      ) {
        return undefined;
      }

      const updatedTask = nextTaskRecordWithAssignment(
        existing,
        assignment,
        new Date().toISOString(),
      );

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      return updatedTask;
    },
    [members, tasks],
  );

  const updateTaskFromReview = useCallback(
    (taskId: string, status: TaskStatus, summary: string) => {
      const existing = tasks.find((task) => task.id === taskId);
      if (!existing) {
        return undefined;
      }

      const occurredAt = new Date().toISOString();
      const updatedTask: TaskRecord = {
        ...existing,
        status,
        updatedAt: occurredAt,
        activity: [
          {
            id: `${taskId}-review-${Date.now()}`,
            type: existing.status === status ? "updated" : "status",
            actor: { type: "system", label: "You" },
            summary,
            occurredAt,
          },
          ...existing.activity,
        ],
      };

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      return updatedTask;
    },
    [tasks],
  );

  const value = useMemo(
    () => ({
      tasks,
      createTask,
      updateTask,
      updateTaskAssignment,
      updateTaskFromReview,
    }),
    [tasks, createTask, updateTask, updateTaskAssignment, updateTaskFromReview],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

function useTasks() {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider.");
  }

  return context;
}

export { TasksProvider, useTasks };
