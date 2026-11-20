"use client";

import Link from "next/link";
import { ArrowLeft, Check, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAgentOnboarding } from "./wizard-context";
import { AgentIdentityRequired } from "./wizard-frame";

function CompleteAgentStep() {
  const { config, resetConfig } = useAgentOnboarding();

  if (!config.name.trim()) {
    return <AgentIdentityRequired />;
  }

  const framework =
    config.framework === "Other"
      ? config.otherFramework.trim() || "Other"
      : config.framework || "Not specified";
  const deployment =
    config.deployment === "Other"
      ? config.otherDeployment.trim() || "Other"
      : config.deployment || "Not specified";
  const modelProvider = [config.model.trim(), config.provider.trim()]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      <Alert variant="info">
        <Check aria-hidden="true" />
        <AlertDescription>
          Demonstration setup complete. The configuration below has not
          connected an agent or created an agent registry record.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-card-title leading-snug font-medium">
              Agent configuration summary
            </h3>
            <Badge variant="outline">Demonstration only</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
            <SummaryField label="Agent name">{config.name}</SummaryField>
            <SummaryField label="Framework">{framework}</SummaryField>
            <SummaryField label="Role or description">
              {config.roleDescription.trim() || "Not provided"}
            </SummaryField>
            <SummaryField label="Deployment environment">
              {deployment}
            </SummaryField>
            {config.environmentDetails.trim() && (
              <SummaryField label="Environment details">
                {config.environmentDetails}
              </SummaryField>
            )}
            <SummaryField label="Model / provider">
              {modelProvider || "Not provided"}
            </SummaryField>
            <SummaryField label="Agent record created">
              No — this demonstration does not create a registry record.
            </SummaryField>
            <SummaryField label="Live connection">
              Not connected; no connection was attempted.
            </SummaryField>
          </dl>

          <div className="border-t border-border pt-4">
            <h3 className="text-body font-medium">Integration information</h3>
            <dl className="mt-3 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">
              <SummaryField label="Endpoint or address">
                {config.integrationEndpoint.trim() || "None provided"}
              </SummaryField>
              <SummaryField label="Configuration details">
                {config.integrationDetails.trim() || "None provided"}
              </SummaryField>
              <SummaryField label="Environment notes">
                {config.environmentNotes.trim() || "None provided"}
              </SummaryField>
            </dl>
            <p className="mt-4 text-metadata text-muted-foreground">
              Only non-secret information should be included. The wizard keeps
              this draft in page memory and does not submit it to a service.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-body text-muted-foreground">
        No Agent Details page is available for this entry because this flow has
        not created a demonstration agent record.
      </p>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <Link
          href="/agents"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden="true" />
          Return to Agent Registry
        </Link>
        <Link
          href="/agents/connect"
          onClick={() => resetConfig()}
          className={buttonVariants()}
        >
          <Plus aria-hidden="true" />
          Connect another agent
        </Link>
      </div>
    </div>
  );
}

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-metadata text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-body text-foreground">
        {children}
      </dd>
    </div>
  );
}

export { CompleteAgentStep };
