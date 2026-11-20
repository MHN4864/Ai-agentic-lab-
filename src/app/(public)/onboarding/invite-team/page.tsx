import type { Metadata } from "next";
import { InviteTeamForm } from "@/components/auth/onboarding-forms";

export const metadata: Metadata = {
  title: "Invite your team | Ai Agentic Lab",
};

export default function InviteTeamPage() {
  return <InviteTeamForm />;
}
