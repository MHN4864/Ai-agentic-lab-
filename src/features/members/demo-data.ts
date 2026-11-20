import { projectDemoData } from "@/features/projects/demo-data";
import type { ProjectWorkAssignee } from "@/features/projects/types";
import { memberIdFromName, teamIdFromName } from "./directory-utils";
import type { WorkspaceMember } from "./types";

function getHumanAssignees(assignee: ProjectWorkAssignee) {
  return assignee.type === "human" ? [assignee.name] : [];
}

const memberNames = new Set(
  projectDemoData.flatMap((project) => [
    ...(project.owner ? [project.owner] : []),
    ...project.workItems.flatMap((workItem) =>
      getHumanAssignees(workItem.assignee),
    ),
  ]),
);

const memberProfiles: Record<string, { email: string; roleTitle: string }> = {
  "Maya Chen": {
    email: "maya.chen@example.com",
    roleTitle: "Engineering Manager",
  },
  "Jordan Lee": {
    email: "jordan.lee@example.com",
    roleTitle: "Customer Operations Lead",
  },
  "Sam Rivera": {
    email: "sam.rivera@example.com",
    roleTitle: "Infrastructure Engineer",
  },
  "Avery Patel": {
    email: "avery.patel@example.com",
    roleTitle: "Product Manager",
  },
  "Taylor Morgan": {
    email: "taylor.morgan@example.com",
    roleTitle: "AI Evaluation Lead",
  },
};

const existingMembers: WorkspaceMember[] = [...memberNames].map((name) => {
  const profile = memberProfiles[name] ?? {
    email: `${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.com`,
    roleTitle: "Team member",
  };
  const team = projectDemoData.find((project) => project.owner === name)?.team;

  return {
    id: memberIdFromName(name),
    name,
    ...profile,
    status: "active",
    ...(team ? { team, teamId: teamIdFromName(team) } : {}),
  };
});

export const memberDemoData: WorkspaceMember[] = [
  ...existingMembers,
  {
    id: "member-chris-park",
    name: "Chris Park",
    email: "chris.park@example.com",
    roleTitle: "Solutions Engineer",
    status: "invited",
    team: "Platform",
    teamId: teamIdFromName("Platform"),
  },
  {
    id: "member-riley-brooks",
    name: "Riley Brooks",
    email: "riley.brooks@example.com",
    roleTitle: "Program Analyst",
    status: "suspended",
    team: "Product Engineering",
    teamId: teamIdFromName("Product Engineering"),
  },
];
