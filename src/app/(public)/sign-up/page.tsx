import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Create an account | Ai Agentic Lab",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
