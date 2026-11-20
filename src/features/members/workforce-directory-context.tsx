"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { teamDemoData } from "@/features/teams/demo-data";
import type { TeamFormValues, WorkspaceTeam } from "@/features/teams/types";
import { useProjects } from "@/features/projects/projects-context";
import type { ProjectFormValues } from "@/features/projects/types";
import { memberDemoData } from "./demo-data";
import { uniqueDirectoryId } from "./directory-utils";
import type { MemberFormValues, WorkspaceMember } from "./types";

type WorkforceDirectoryContextValue = {
  members: WorkspaceMember[];
  teams: WorkspaceTeam[];
  createMember: (values: MemberFormValues) => WorkspaceMember | undefined;
  updateMember: (
    memberId: string,
    values: MemberFormValues,
  ) => WorkspaceMember | undefined;
  createTeam: (values: TeamFormValues) => WorkspaceTeam | undefined;
  updateTeam: (
    teamId: string,
    values: TeamFormValues,
  ) => WorkspaceTeam | undefined;
};

const WorkforceDirectoryContext =
  createContext<WorkforceDirectoryContextValue | null>(null);

function projectFormValues(
  project: {
    name: string;
    description: string;
    status: ProjectFormValues["status"];
    priority: ProjectFormValues["priority"];
    owner?: string;
    team?: string;
    startDate?: string;
    targetDate?: string;
    goals?: string;
  },
  owner: string,
): ProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    owner,
    team: project.team ?? "",
    startDate: project.startDate ?? "",
    targetDate: project.targetDate ?? "",
    goals: project.goals ?? "",
  };
}

function WorkforceDirectoryProvider({ children }: { children: ReactNode }) {
  const { projects, updateProject } = useProjects();
  const [members, setMembers] = useState(memberDemoData);
  const [teams, setTeams] = useState(teamDemoData);

  const createMember = useCallback(
    (values: MemberFormValues) => {
      const team = teams.find((candidate) => candidate.id === values.teamId);
      if (values.teamId && !team) {
        return undefined;
      }

      const member: WorkspaceMember = {
        id: uniqueDirectoryId(
          "member",
          values.name,
          members.map((candidate) => candidate.id),
        ),
        name: values.name.trim(),
        email: values.email.trim().toLocaleLowerCase(),
        roleTitle: values.roleTitle.trim(),
        status: values.status,
        ...(team ? { teamId: team.id, team: team.name } : {}),
      };
      setMembers((current) => [...current, member]);
      return member;
    },
    [members, teams],
  );

  const updateMember = useCallback(
    (memberId: string, values: MemberFormValues) => {
      const existing = members.find((candidate) => candidate.id === memberId);
      const team = teams.find((candidate) => candidate.id === values.teamId);
      if (!existing || (values.teamId && !team)) {
        return undefined;
      }

      const name = values.name.trim();
      const updatedMember: WorkspaceMember = {
        ...existing,
        name,
        email: values.email.trim().toLocaleLowerCase(),
        roleTitle: values.roleTitle.trim(),
        status: values.status,
        teamId: team?.id,
        team: team?.name,
        previousNames:
          name !== existing.name
            ? [...new Set([...(existing.previousNames ?? []), existing.name])]
            : existing.previousNames,
      };

      if (name !== existing.name) {
        for (const project of projects) {
          if (project.owner === existing.name) {
            updateProject(
              project.id,
              projectFormValues(project, name),
            );
          }
        }
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === memberId ? updatedMember : member,
        ),
      );
      return updatedMember;
    },
    [members, projects, teams, updateProject],
  );

  const createTeam = useCallback(
    (values: TeamFormValues) => {
      const leadMember = members.find(
        (member) => member.id === values.leadMemberId,
      );
      if (values.leadMemberId && !leadMember) {
        return undefined;
      }

      const name = values.name.trim();
      const team: WorkspaceTeam = {
        id: uniqueDirectoryId(
          "team",
          name,
          teams.map((candidate) => candidate.id),
        ),
        name,
        description: values.description.trim(),
        ...(leadMember ? { leadMemberId: leadMember.id } : {}),
        projectTeamNames: [name],
      };
      setTeams((current) => [...current, team]);
      return team;
    },
    [members, teams],
  );

  const updateTeam = useCallback(
    (teamId: string, values: TeamFormValues) => {
      const existing = teams.find((candidate) => candidate.id === teamId);
      const leadMember = members.find(
        (member) => member.id === values.leadMemberId,
      );
      if (!existing || (values.leadMemberId && !leadMember)) {
        return undefined;
      }

      const name = values.name.trim();
      const updatedTeam: WorkspaceTeam = {
        ...existing,
        name,
        description: values.description.trim(),
        leadMemberId: leadMember?.id,
        projectTeamNames: [
          ...new Set([...existing.projectTeamNames, existing.name, name]),
        ],
      };
      setTeams((current) =>
        current.map((team) => (team.id === teamId ? updatedTeam : team)),
      );
      setMembers((current) =>
        current.map((member) =>
          member.teamId === teamId ? { ...member, team: name } : member,
        ),
      );
      return updatedTeam;
    },
    [members, teams],
  );

  const value = useMemo(
    () => ({
      members,
      teams,
      createMember,
      updateMember,
      createTeam,
      updateTeam,
    }),
    [members, teams, createMember, updateMember, createTeam, updateTeam],
  );

  return (
    <WorkforceDirectoryContext.Provider value={value}>
      {children}
    </WorkforceDirectoryContext.Provider>
  );
}

function useWorkforceDirectory() {
  const context = useContext(WorkforceDirectoryContext);
  if (!context) {
    throw new Error(
      "useWorkforceDirectory must be used within a WorkforceDirectoryProvider.",
    );
  }
  return context;
}

export { WorkforceDirectoryProvider, useWorkforceDirectory };
