export type MembershipStatus = "active" | "invited" | "suspended";

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  status: MembershipStatus;
  teamId?: string;
  team?: string;
  previousNames?: string[];
};

export type MemberFormValues = {
  name: string;
  email: string;
  roleTitle: string;
  status: MembershipStatus;
  teamId: string;
};
