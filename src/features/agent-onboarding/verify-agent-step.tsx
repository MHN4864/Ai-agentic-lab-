"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAgentOnboarding } from "./wizard-context";
import { AgentIdentityRequired } from "./wizard-frame";

const verificationChecks = [
  {
    title: "Agent configuration reviewed",
    result: "Simulated",
    description: "Only the information entered in this wizard is summarized.",
  },
  {
    title: "Integration requirements identified",
    result: "Not assessed",
    description: "No technical compatibility or network checks are performed.",
  },
  {
    title: "Connection readiness",
    result: "Not tested",
    description: "A future connection attempt would be required to test readiness.",
  },
  {
    title: "Metadata discovery",
    result: "Not performed",
    description: "No live agent metadata has been requested or discovered.",
  },
  {
    title: "Capability discovery",
    result: "Not performed",
    description: "No live agent capabilities have been requested or discovered.",
  },
] as const;

function VerifyAgentStep() {
  const router = useRouter();
  const { config } = useAgentOnboarding();

  if (!config.name.trim()) {
    return <AgentIdentityRequired />;
  }

  return (
    <div className="space-y-5">
      <Alert variant="warning">
        <Info aria-hidden="true" />
        <AlertDescription>
          Simulated verification only. This page has not contacted the agent,
          tested connectivity, or verified integration requirements.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CircleHelp className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-card-title leading-snug font-medium">
                Demonstration checklist
              </h3>
              <p className="mt-1 text-body text-muted-foreground">
                These labels describe the limits of this frontend flow, not
                successful live checks.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {verificationChecks.map((check) => (
              <li
                key={check.title}
                className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="text-body font-medium">{check.title}</h3>
                  <p className="mt-0.5 text-body text-muted-foreground">
                    {check.description}
                  </p>
                </div>
                <StatusBadge tone="neutral" category="Demonstration check">
                  {check.result}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <StatusSummary
          label="Configuration"
          value="Complete for this demo"
          description="Required agent information has been entered."
        />
        <StatusSummary
          label="Future connection attempt"
          value="Prepared for a future attempt"
          description="Demo handoff only; technical readiness is not verified."
        />
        <StatusSummary
          label="Live connection"
          value="Not available"
          description="No live connection is made in this frontend demo."
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <Link
          href="/agents/connect/configure"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden="true" />
          Back to configuration
        </Link>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => router.push("/agents/connect/complete")}
        >
          Continue to summary
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function StatusSummary({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border p-3">
      <p className="text-metadata text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-body font-medium">{value}</p>
      <p className="mt-1 text-metadata text-muted-foreground">{description}</p>
    </div>
  );
}

export { VerifyAgentStep };
