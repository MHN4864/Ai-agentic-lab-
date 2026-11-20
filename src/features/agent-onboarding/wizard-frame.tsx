import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { ContentContainer, PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stepLabels = ["Identify", "Configure", "Verify", "Complete"] as const;

function AgentWizardFrame({
  step,
  title,
  description,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <ContentContainer className="space-y-6">
      <PageHeader
        title="Connect an agent"
        description="Prepare a customer-owned agent for a future supported connection."
        actions={
          <Link
            href="/agents"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Cancel
          </Link>
        }
      />

      <nav aria-label="Agent onboarding progress">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < step;
            const current = stepNumber === step;

            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2",
                  current && "border-primary/40 bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-metadata text-muted-foreground",
                    complete && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary text-primary",
                  )}
                >
                  {complete ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-control text-muted-foreground",
                    current && "font-medium text-foreground",
                    complete && "text-foreground",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <Card className="min-w-0">
        <CardHeader>
          <p className="text-metadata font-medium text-muted-foreground">
            Step {step} of 4
          </p>
          <h2 className="mt-1 font-heading text-card-title leading-snug font-medium">
            {title}
          </h2>
          <p className="text-body text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <Alert variant="info">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          This is a frontend demonstration only. No connection is attempted,
          no credentials are requested or stored, and no agent record is
          created. Your unsent entries stay in page memory while navigating
          these steps; leaving the wizard or refreshing clears them.
        </AlertDescription>
      </Alert>
    </ContentContainer>
  );
}

function AgentIdentityRequired() {
  return (
    <div className="rounded-md border border-warning/30 bg-warning/10 p-4">
      <h3 className="text-body font-medium">Identify the agent first</h3>
      <p className="mt-1 text-body text-muted-foreground">
        Enter a required agent name before continuing through onboarding.
      </p>
      <Link
        href="/agents/connect"
        className="mt-3 inline-flex min-h-8 items-center rounded-sm text-control font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        Return to agent details
      </Link>
    </div>
  );
}

export { AgentIdentityRequired, AgentWizardFrame };
