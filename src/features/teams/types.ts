export type WorkspaceTeam = {
  id: string;
  name: string;
  description: string;
  leadMemberId?: string;
  projectTeamNames: string[];
};

export type TeamFormValues = {
  name: string;
  description: string;
  leadMemberId: string;
};
