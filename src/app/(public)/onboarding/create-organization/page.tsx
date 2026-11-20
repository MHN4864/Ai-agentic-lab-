import type { Metadata } from "next";
import { CreateOrganizationForm } from "@/components/auth/onboarding-forms";

export const metadata: Metadata = {
  title: "Create organization | Ai Agentic Lab",
};

export default function CreateOrganizationPage() {
  return <CreateOrganizationForm />;
}
