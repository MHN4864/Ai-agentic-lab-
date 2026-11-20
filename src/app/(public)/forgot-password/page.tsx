import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Reset password | Ai Agentic Lab",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
