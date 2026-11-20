"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAgentOnboarding } from "./wizard-context";
import { AgentIdentityRequired } from "./wizard-frame";

function ConfigureIntegrationStep() {
  const router = useRouter();
  const { config, updateConfig } = useAgentOnboarding();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (config.name.trim()) {
      router.push("/agents/connect/verify");
    }
  }

  if (!config.name.trim()) {
    return <AgentIdentityRequired />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Alert variant="info">
        <Info aria-hidden="true" />
        <AlertDescription>
          The appropriate connection approach depends on the agent and its
          environment. This flexible area collects optional context; it does not
          require a particular framework or connection mechanism.
        </AlertDescription>
      </Alert>

      <div className="space-y-1.5">
        <Label htmlFor="integration-endpoint">
          Endpoint or address (if applicable)
        </Label>
        <Input
          id="integration-endpoint"
          value={config.integrationEndpoint}
          onChange={(event) =>
            updateConfig({ integrationEndpoint: event.target.value })
          }
          placeholder="Optional endpoint or non-secret address"
          autoComplete="off"
        />
        <p className="text-metadata text-muted-foreground">
          Leave blank if no endpoint is relevant at this stage.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="integration-details">
          Integration or configuration details (optional)
        </Label>
        <Textarea
          id="integration-details"
          value={config.integrationDetails}
          onChange={(event) =>
            updateConfig({ integrationDetails: event.target.value })
          }
          placeholder="Add non-secret details that may help determine a future supported setup."
          rows={4}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="integration-notes">
          Environment notes (optional)
        </Label>
        <Textarea
          id="integration-notes"
          value={config.environmentNotes}
          onChange={(event) =>
            updateConfig({ environmentNotes: event.target.value })
          }
          placeholder="Share any additional non-secret context."
          rows={3}
          autoComplete="off"
        />
      </div>

      <Alert variant="warning">
        <ShieldAlert aria-hidden="true" />
        <AlertDescription>
          Do not enter API keys, passwords, bearer tokens, private credentials,
          or unrestricted administrative access. This demonstration does not
          submit or store any information.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border border-border bg-muted/40 p-4">
        <h3 className="text-body font-medium">Private network environments</h3>
        <p className="mt-1 text-body text-muted-foreground">
          A private network may require an appropriate customer-side integration
          component in a future supported setup. No component is provided or
          installed by this demonstration.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <Link
          href="/agents/connect"
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden="true" />
          Back
        </Link>
        <Button type="submit" className="w-full sm:w-auto">
          Continue to verification
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}

export { ConfigureIntegrationStep };
