import type { ReviewRecord } from "./types";

export const reviewDemoData: ReviewRecord[] = [
  {
    id: "REV-0999",
    taskId: "TASK-2051",
    submitter: { type: "agent", agentId: "agent-atlas" },
    reviewerMemberId: "member-sam-rivera",
    deliverable: {
      type: "text-summary",
      title: "Initial recovery options draft",
      content:
        "A preliminary summary of recovery options for delayed connection signals.",
    },
    status: "changes-requested",
    submittedAt: "2026-11-16T13:00:00.000Z",
    updatedAt: "2026-11-17T09:00:00.000Z",
    history: [
      {
        id: "REV-0999-E1",
        type: "submitted",
        actor: { type: "agent", agentId: "agent-atlas" },
        occurredAt: "2026-11-16T13:00:00.000Z",
      },
      {
        id: "REV-0999-E2",
        type: "review-started",
        actor: { type: "human", memberId: "member-sam-rivera" },
        occurredAt: "2026-11-16T15:00:00.000Z",
      },
      {
        id: "REV-0999-E3",
        type: "changes-requested",
        actor: { type: "human", memberId: "member-sam-rivera" },
        occurredAt: "2026-11-17T09:00:00.000Z",
        feedback:
          "Add the customer-owned boundary and identify which details need human confirmation.",
      },
    ],
  },
  {
    id: "REV-1001",
    taskId: "TASK-2051",
    submitter: { type: "agent", agentId: "agent-atlas" },
    reviewerMemberId: "member-sam-rivera",
    deliverable: {
      type: "markdown",
      title: "Operator handoff recovery guidance",
      content:
        "## Recovery options\n\n- Verify the reported connection state.\n- Confirm which recovery actions are customer-owned.\n- Escalate unresolved signals to a human operator.\n\nNo live connection was tested for this demonstration.",
    },
    status: "awaiting-review",
    submittedAt: "2026-11-18T16:30:00.000Z",
    updatedAt: "2026-11-18T16:30:00.000Z",
    history: [
      {
        id: "REV-1001-E1",
        type: "submitted",
        actor: { type: "agent", agentId: "agent-atlas" },
        occurredAt: "2026-11-18T16:30:00.000Z",
      },
    ],
  },
  {
    id: "REV-1002",
    taskId: "TASK-2012",
    submitter: { type: "agent", agentId: "agent-hermes" },
    reviewerMemberId: "member-jordan-lee",
    deliverable: {
      type: "structured-result",
      title: "Support intake category draft",
      content:
        '{\n  "categories": [\n    { "name": "Account access", "examples": 3 },\n    { "name": "Connection status", "examples": 4 },\n    { "name": "Usage question", "examples": 2 }\n  ],\n  "requiresHumanConfirmation": true\n}',
    },
    status: "in-review",
    submittedAt: "2026-11-17T14:00:00.000Z",
    updatedAt: "2026-11-18T14:15:00.000Z",
    history: [
      {
        id: "REV-1002-E1",
        type: "submitted",
        actor: { type: "agent", agentId: "agent-hermes" },
        occurredAt: "2026-11-17T14:00:00.000Z",
      },
      {
        id: "REV-1002-E2",
        type: "review-started",
        actor: { type: "human", memberId: "member-jordan-lee" },
        occurredAt: "2026-11-18T14:15:00.000Z",
      },
    ],
  },
  {
    id: "REV-1003",
    taskId: "TASK-2016",
    submitter: { type: "human", memberId: "member-jordan-lee" },
    reviewerMemberId: "member-maya-chen",
    deliverable: {
      type: "text-summary",
      title: "Sample summary review notes",
      content:
        "The samples are clear overall. Two examples still need an explicit escalation boundary before they are ready to share.",
    },
    status: "changes-requested",
    submittedAt: "2026-11-15T10:00:00.000Z",
    updatedAt: "2026-11-17T15:00:00.000Z",
    history: [
      {
        id: "REV-1003-E1",
        type: "submitted",
        actor: { type: "human", memberId: "member-jordan-lee" },
        occurredAt: "2026-11-15T10:00:00.000Z",
      },
      {
        id: "REV-1003-E2",
        type: "review-started",
        actor: { type: "human", memberId: "member-maya-chen" },
        occurredAt: "2026-11-16T09:30:00.000Z",
      },
      {
        id: "REV-1003-E3",
        type: "changes-requested",
        actor: { type: "human", memberId: "member-maya-chen" },
        occurredAt: "2026-11-17T15:00:00.000Z",
        feedback:
          "Please add an explicit escalation boundary to the two examples that mention delayed agent responses.",
      },
    ],
  },
  {
    id: "REV-1004",
    taskId: "TASK-1901",
    submitter: { type: "human", memberId: "member-avery-patel" },
    reviewerMemberId: "member-jordan-lee",
    deliverable: {
      type: "attachment-placeholder",
      title: "Release readiness summary",
      fileName: "release-readiness-summary.pdf",
      content:
        "Demonstration attachment placeholder. No file was uploaded or stored.",
    },
    status: "approved",
    submittedAt: "2026-10-29T11:00:00.000Z",
    updatedAt: "2026-10-30T16:00:00.000Z",
    history: [
      {
        id: "REV-1004-E1",
        type: "submitted",
        actor: { type: "human", memberId: "member-avery-patel" },
        occurredAt: "2026-10-29T11:00:00.000Z",
      },
      {
        id: "REV-1004-E2",
        type: "review-started",
        actor: { type: "human", memberId: "member-jordan-lee" },
        occurredAt: "2026-10-30T14:00:00.000Z",
      },
      {
        id: "REV-1004-E3",
        type: "approved",
        actor: { type: "human", memberId: "member-jordan-lee" },
        occurredAt: "2026-10-30T16:00:00.000Z",
        feedback: "The summary is complete and ready for the team.",
      },
    ],
  },
  {
    id: "REV-1005",
    taskId: "TASK-2053",
    submitter: { type: "human", memberId: "member-maya-chen" },
    reviewerMemberId: "member-sam-rivera",
    deliverable: {
      type: "markdown",
      title: "Escalation criteria proposal",
      content:
        "## Proposed threshold\n\nEscalate after an unspecified period of delay.",
    },
    status: "rejected",
    submittedAt: "2026-11-17T09:00:00.000Z",
    updatedAt: "2026-11-18T10:00:00.000Z",
    history: [
      {
        id: "REV-1005-E1",
        type: "submitted",
        actor: { type: "human", memberId: "member-maya-chen" },
        occurredAt: "2026-11-17T09:00:00.000Z",
      },
      {
        id: "REV-1005-E2",
        type: "review-started",
        actor: { type: "human", memberId: "member-sam-rivera" },
        occurredAt: "2026-11-17T14:00:00.000Z",
      },
      {
        id: "REV-1005-E3",
        type: "rejected",
        actor: { type: "human", memberId: "member-sam-rivera" },
        occurredAt: "2026-11-18T10:00:00.000Z",
        feedback:
          "This proposal does not specify a measurable threshold or a responsible escalation owner.",
      },
    ],
  },
];
