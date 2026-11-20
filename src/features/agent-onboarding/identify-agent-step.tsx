"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAgentOnboarding } from "./wizard-context";
import type {
  AgentDeploymentChoice,
  AgentFrameworkChoice,
} from "./types";

const frameworkOptions: { value: AgentFrameworkChoice; label: string }[] = [
  { value: "OpenClaw", label: "OpenClaw" },
  { value: "Hermes", label: "Hermes" },
  { value: "LangGraph", label: "LangGraph" },
  { value: "CrewAI", label: "CrewAI" },
  { value: "Custom", label: "Custom" },
  { value: "Other", label: "Other" },
];

const deploymentOptions: { value: AgentDeploymentChoice; label: string }[] = [
  { value: "Local", label: "Local" },
  { value: "Cloud", label: "Cloud" },
  { value: "VPS", label: "VPS" },
  { value: "Container", label: "Container" },
  { value: "Other", label: "Other" },
];

function getFrameworkChoice(value: string): AgentFrameworkChoice {
  return frameworkOptions.find((option) => option.value === value)?.value ?? "";
}

function getDeploymentChoice(value: string): AgentDeploymentChoice {
  return deploymentOptions.find((option) => option.value === value)?.value ?? "";
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helperText?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-control text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <option value="">Not specified</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-metadata text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

function IdentifyAgentStep() {
  const router = useRouter();
  const { config, updateConfig } = useAgentOnboarding();
  const [nameError, setNameError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = config.name.trim();

    if (!name) {
      setNameError("Enter an agent name to continue.");
      return;
    }

    updateConfig({ name });
    setNameError("");
    router.push("/agents/connect/configure");
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="agent-name">
          Agent name <span aria-hidden="true" className="text-error">*</span>
        </Label>
        <Input
          id="agent-name"
          value={config.name}
          onChange={(event) => {
            updateConfig({ name: event.target.value });
            if (nameError) setNameError("");
          }}
          placeholder="e.g. Research Assistant"
          required
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "agent-name-error" : "agent-name-hint"}
        />
        {nameError ? (
          <p id="agent-name-error" role="alert" className="text-metadata text-error">
            {nameError}
          </p>
        ) : (
          <p id="agent-name-hint" className="text-metadata text-muted-foreground">
            Use a name your team will recognize.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="agent-role">Role or description</Label>
        <Textarea
          id="agent-role"
          value={config.roleDescription}
          onChange={(event) =>
            updateConfig({ roleDescription: event.target.value })
          }
          placeholder="What work is this agent responsible for?"
          rows={3}
        />
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <SelectField
          id="agent-framework"
          label="Framework (optional)"
          value={config.framework}
          onChange={(value) =>
            updateConfig({ framework: getFrameworkChoice(value) })
          }
          options={frameworkOptions}
          helperText="Framework is metadata only; it does not limit support."
        />
        {config.framework === "Other" && (
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="agent-framework-other">Framework name</Label>
            <Input
              id="agent-framework-other"
              value={config.otherFramework}
              onChange={(event) =>
                updateConfig({ otherFramework: event.target.value })
              }
              placeholder="Optional"
            />
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="agent-model">Model (optional)</Label>
          <Input
            id="agent-model"
            value={config.model}
            onChange={(event) => updateConfig({ model: event.target.value })}
            placeholder="Model name, if known"
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="agent-provider">Model provider (optional)</Label>
          <Input
            id="agent-provider"
            value={config.provider}
            onChange={(event) => updateConfig({ provider: event.target.value })}
            placeholder="Provider name, if known"
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <SelectField
          id="agent-deployment"
          label="Deployment environment (optional)"
          value={config.deployment}
          onChange={(value) =>
            updateConfig({ deployment: getDeploymentChoice(value) })
          }
          options={deploymentOptions}
        />
        {config.deployment === "Other" && (
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="agent-deployment-other">Environment type</Label>
            <Input
              id="agent-deployment-other"
              value={config.otherDeployment}
              onChange={(event) =>
                updateConfig({ otherDeployment: event.target.value })
              }
              placeholder="Optional"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="agent-environment-details">
          Environment details (optional)
        </Label>
        <Textarea
          id="agent-environment-details"
          value={config.environmentDetails}
          onChange={(event) =>
            updateConfig({ environmentDetails: event.target.value })
          }
          placeholder="Add helpful, non-secret context about where the agent runs."
          rows={3}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="submit" className="w-full sm:w-auto">
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}

export { IdentifyAgentStep };
