import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-6 sm:px-6">
        <Link
          href="/sign-in"
          className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Ai Agentic Lab
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-6 text-center sm:px-6">
        <p className="text-metadata text-muted-foreground">
          Demonstration only. Forms do not create accounts, send messages, or
          create real workspaces.
        </p>
      </footer>
    </div>
  );
}

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="px-6 pt-6 pb-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 py-6">{children}</CardContent>
    </Card>
  );
}

function AuthField({
  id,
  label,
  error,
  description,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-error" role="alert">
          {error}
        </p>
      ) : description ? (
        <p id={`${id}-description`} className="text-metadata text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { AuthCard, AuthField, AuthLayout };
