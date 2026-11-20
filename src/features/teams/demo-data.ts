import { projectDemoData } from "@/features/projects/demo-data";
import { memberIdFromName, teamIdFromName } from "@/features/members/directory-utils";
import type { WorkspaceTeam } from "./types";

const teamDescriptions: Record<string, string> = {
  Platform: "Build and operate the shared platform foundations.",
  "Customer Operations":
    "Coordinate customer workflows and operational support.",
  Infrastructure:
    "Maintain integration resilience and infrastructure readiness.",
  "Product Engineering":
    "Coordinate product delivery, quality, and release readiness.",
  "Applied AI":
    "Develop evaluation approaches for framework-independent agent work.",
};

const teamNames = [
  ...new Set(
    projectDemoData
      .map((project) => project.team)
      .filter((team): team is string => Boolean(team)),
  ),
];

export const teamDemoData: WorkspaceTeam[] = teamNames.map((name) => {
  const project = projectDemoData.find((candidate) => candidate.team === name);
  return {
    id: teamIdFromName(name),
    name,
    description:
      teamDescriptions[name] ?? "A demonstration organization team.",
    ...(project?.owner
      ? { leadMemberId: memberIdFromName(project.owner) }
      : {}),
    projectTeamNames: [name],
  };
});
