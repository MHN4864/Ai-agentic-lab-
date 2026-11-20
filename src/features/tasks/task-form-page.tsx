"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agentDemoData } from "@/features/agents/demo-data";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { useProjects } from "@/features/projects/projects-context";
import { projectPriorityLabels } from "@/features/projects/project-labels";
import { taskStatusLabels, taskTypeLabels } from "./labels";
import { useTasks } from "./tasks-context";
import type {
  TaskAssignee,
  TaskFormValues,
  TaskPriority,
  TaskRecord,
  TaskStatus,
  TaskType,
} from "./types";

const emptyValues: TaskFormValues = {
  title: "",
  description: "",
  projectId: "",
  status: "ready",
  priority: "medium",
  taskType: "human",
  primaryAssignee: null,
  dueDate: "",
  acceptanceCriteria: "",
  context: "",
};

function isTaskStatus(value: string): value is TaskStatus {
  return Object.prototype.hasOwnProperty.call(taskStatusLabels, value);
}

function isTaskPriority(value: string): value is TaskPriority {
  return Object.prototype.hasOwnProperty.call(projectPriorityLabels, value);
}

function isTaskType(value: string): value is TaskType {
  return Object.prototype.hasOwnProperty.call(taskTypeLabels, value);
}

function formValuesFromTask(task: TaskRecord): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    status: task.status,
    priority: task.priority,
    taskType: task.taskType,
    primaryAssignee: task.assignment.primaryAssignee,
    dueDate: task.dueDate ?? "",
    acceptanceCriteria: task.acceptanceCriteria,
    context: task.context,
  };
}

function assigneeValue(assignee: TaskAssignee | null) {
  if (!assignee) {
    return "";
  }

  return assignee.type === "human"
    ? `human:${assignee.memberId}`
    : `agent:${assignee.agentId}`;
}

function parseAssigneeValue(
  value: string,
  memberIds: string[],
): TaskAssignee | null | undefined {
  if (!value) {
    return null;
  }

  if (value.startsWith("human:")) {
    const memberId = value.slice("human:".length);
    return memberIds.includes(memberId)
      ? { type: "human", memberId }
      : undefined;
  }

  if (value.startsWith("agent:")) {
    const agentId = value.slice("agent:".length);
    return agentDemoData.some((agent) => agent.id === agentId)
      ? { type: "agent", agentId }
      : undefined;
  }

  return undefined;
}

function isValidDateInput(value: string) {
  if (!value) {
    return true;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function TaskFormPage({
  mode,
  taskId,
}: {
  mode: "create" | "edit";
  taskId?: string;
}) {
  const router = useRouter();
  const { projects } = useProjects();
  const { members } = useWorkforceDirectory();
  const { tasks, createTask, updateTask } = useTasks();
  const task = taskId
    ? tasks.find((candidate) => candidate.id === taskId)
    : undefined;
  const [values, setValues] = useState<TaskFormValues>(() =>
    task ? formValuesFromTask(task) : emptyValues,
  );
  const [titleError, setTitleError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [assigneeError, setAssigneeError] = useState("");
  const [dateError, setDateError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (mode === "edit" && !task) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Task not found"
          description="This task is not available in the current demonstration data."
        />
        <Link href="/tasks" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  const cancelHref =
    mode === "edit" && taskId ? `/tasks/${taskId}` : "/tasks";

  function updateValue<Key extends keyof TaskFormValues>(
    key: Key,
    value: TaskFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFormError("");
    setTitleError("");
    setProjectError("");
    setAssigneeError("");
    setDateError("");
  }

  function handleTypeChange(value: string) {
    if (!isTaskType(value)) {
      return;
    }

    setValues((current) => ({
      ...current,
      taskType: value,
      primaryAssignee:
        value === "collaborative" ||
        !current.primaryAssignee ||
        current.primaryAssignee.type === value
          ? current.primaryAssignee
          : null,
    }));
    setAssigneeError("");
    setFormError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const title = values.title.trim();
    if (!title) {
      setTitleError("Enter a task title.");
      return;
    }
    setTitleError("");

    if (!projects.some((project) => project.id === values.projectId)) {
      setProjectError("Select an available project.");
      return;
    }
    setProjectError("");

    if (!isValidDateInput(values.dueDate)) {
      setDateError("Enter a valid due date.");
      return;
    }
    setDateError("");

    if (
      values.primaryAssignee &&
      ((values.taskType === "human" &&
        values.primaryAssignee.type !== "human") ||
        (values.taskType === "agent" &&
          values.primaryAssignee.type !== "agent"))
    ) {
      setAssigneeError(
        "Choose an assignee that matches the selected task type.",
      );
      return;
    }
    setAssigneeError("");

    setIsSubmitting(true);
    const formValues = { ...values, title };
    const savedTask =
      mode === "create"
        ? createTask(formValues)
        : taskId
          ? updateTask(taskId, formValues)
          : undefined;

    if (!savedTask) {
      setIsSubmitting(false);
      setFormError(
        "The selected project or assignee is no longer available. Review your selections and try again.",
      );
      return;
    }

    router.push(`/tasks/${savedTask.id}`);
  }

  const assigneeOptions =
    values.taskType === "human"
      ? members.map(
          (member) => [`human:${member.id}`, member.name] as [string, string],
        )
      : values.taskType === "agent"
        ? agentDemoData.map(
            (agent) => [`agent:${agent.id}`, agent.name] as [string, string],
          )
        : [
            ...members.map(
              (member) =>
                [`human:${member.id}`, `${member.name} (Human)`] as [
                  string,
                  string,
                ],
            ),
            ...agentDemoData.map(
              (agent) =>
                [`agent:${agent.id}`, `${agent.name} (Agent)`] as [
                  string,
                  string,
                ],
            ),
          ].sort((first, second) => first[1].localeCompare(second[1]));

  return (
    <div className="space-y-6">
      <Link
        href={cancelHref}
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-control font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {mode === "edit" ? "Back to task" : "Back to Tasks"}
      </Link>

      <PageHeader
        title={mode === "create" ? "Create Task" : "Edit Task"}
        description={
          mode === "create"
            ? "Add work to a project for a person, an agent, or collaborative effort."
            : "Update the task details and project context."
        }
      />

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          Demonstration only. Changes remain in workspace memory and are not
          saved to a backend. Saving a task does not start agent work.
        </AlertDescription>
      </Alert>

      {formError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Card className="min-w-0">
        <CardHeader>
          <h2 className="text-card-title font-medium leading-snug">
            Task information
          </h2>
          <p className="text-body text-muted-foreground">
            Title and project are required. Assignee, due date, and supporting
            details are optional.
          </p>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-title">
                  Task title <span aria-hidden="true">*</span>
                </Label>
                <Input
                  id="task-title"
                  value={values.title}
                  onChange={(event) => updateValue("title", event.target.value)}
                  required
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? "task-title-error" : undefined}
                  placeholder="e.g. Review connection recovery notes"
                />
                {titleError && (
                  <p
                    id="task-title-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {titleError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={values.description}
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  placeholder="Describe the outcome or work needed."
                  rows={3}
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-project">
                  Project <span aria-hidden="true">*</span>
                </Label>
                <select
                  id="task-project"
                  value={values.projectId}
                  onChange={(event) =>
                    updateValue("projectId", event.target.value)
                  }
                  required
                  aria-invalid={Boolean(projectError)}
                  aria-describedby={
                    projectError ? "task-project-error" : undefined
                  }
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {projectError && (
                  <p
                    id="task-project-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {projectError}
                  </p>
                )}
                {!projects.length && (
                  <p className="text-metadata text-muted-foreground">
                    Create a project before adding a task.
                  </p>
                )}
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-status">Status</Label>
                <select
                  id="task-status"
                  value={values.status}
                  onChange={(event) => {
                    if (isTaskStatus(event.target.value)) {
                      updateValue("status", event.target.value);
                    }
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(taskStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={values.priority}
                  onChange={(event) => {
                    if (isTaskPriority(event.target.value)) {
                      updateValue("priority", event.target.value);
                    }
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(projectPriorityLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-type">Task type</Label>
                <select
                  id="task-type"
                  value={values.taskType}
                  onChange={(event) => handleTypeChange(event.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {Object.entries(taskTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-primary-assignee">
                  Primary assignee
                </Label>
                <select
                  id="task-primary-assignee"
                  value={assigneeValue(values.primaryAssignee)}
                  onChange={(event) => {
                    const assignee = parseAssigneeValue(
                      event.target.value,
                      members.map((member) => member.id),
                    );
                    if (assignee !== undefined) {
                      updateValue("primaryAssignee", assignee);
                    } else {
                      setAssigneeError(
                        "Select an available human or agent from the list.",
                      );
                    }
                  }}
                  aria-invalid={Boolean(assigneeError)}
                  aria-describedby={
                    assigneeError ? "task-primary-assignee-error" : undefined
                  }
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {assigneeError && (
                  <p
                    id="task-primary-assignee-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {assigneeError}
                  </p>
                )}
                <p className="text-metadata text-muted-foreground">
                  {values.taskType === "human"
                    ? "Only workspace members are shown."
                    : values.taskType === "agent"
                      ? "Only registered agents are shown."
                      : "Choose a workspace member or registered agent."}
                </p>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) =>
                    updateValue("dueDate", event.target.value)
                  }
                  aria-invalid={Boolean(dateError)}
                  aria-describedby={dateError ? "task-date-error" : undefined}
                />
                {dateError && (
                  <p
                    id="task-date-error"
                    className="text-metadata text-error"
                    role="alert"
                  >
                    {dateError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-acceptance-criteria">
                  Acceptance criteria
                </Label>
                <Textarea
                  id="task-acceptance-criteria"
                  value={values.acceptanceCriteria}
                  onChange={(event) =>
                    updateValue("acceptanceCriteria", event.target.value)
                  }
                  placeholder="Describe what a complete result should include."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="task-context">Additional context</Label>
                <Textarea
                  id="task-context"
                  value={values.context}
                  onChange={(event) => updateValue("context", event.target.value)}
                  placeholder="Add relevant instructions or constraints."
                  rows={3}
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
              <Button type="submit" disabled={isSubmitting || !projects.length}>
                {mode === "create" ? "Create Task" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { TaskFormPage };
