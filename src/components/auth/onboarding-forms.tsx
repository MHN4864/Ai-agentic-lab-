"use client";

import Link from "next/link";
import { Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, AuthField } from "@/components/auth/auth-layout";
import {
  clearError,
  getEmailError,
  getWebsiteError,
} from "@/components/auth/validation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OrganizationErrors = Partial<
  Record<"name" | "website" | "size", string>
>;

function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [useCase, setUseCase] = useState("");
  const [errors, setErrors] = useState<OrganizationErrors>({});
  const [complete, setComplete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: OrganizationErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Enter an organization name.";
    }
    const websiteError = getWebsiteError(website);
    if (websiteError) {
      nextErrors.website = websiteError;
    }
    if (!size) {
      nextErrors.size = "Select an organization size.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setComplete(true);
    }
  }

  return (
    <AuthCard
      title="Create your organization"
      description="Tell us a little about the workspace you want to explore."
    >
      {complete ? (
        <div className="space-y-4">
          <Alert variant="success">
            <AlertTitle>Workspace setup is ready for this demo</AlertTitle>
            <AlertDescription>
              No organization has actually been created or saved.
            </AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => router.push("/onboarding/invite-team")}
          >
            Continue to team invitations
          </Button>
          <Link
            href="/overview"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Skip and continue to workspace
          </Link>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <AuthField
            id="organization-name"
            label="Organization name"
            error={errors.name}
          >
            <Input
              id="organization-name"
              name="organizationName"
              autoComplete="organization"
              required
              value={name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "organization-name-error" : undefined
              }
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((current) => clearError(current, "name"));
                }
              }}
            />
          </AuthField>
          <AuthField
            id="organization-website"
            label="Organization website"
            error={errors.website}
            description="Optional"
          >
            <Input
              id="organization-website"
              name="website"
              type="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={website}
              aria-invalid={Boolean(errors.website)}
              aria-describedby={
                errors.website
                  ? "organization-website-error"
                  : "organization-website-description"
              }
              onChange={(event) => {
                setWebsite(event.target.value);
                if (errors.website) {
                  setErrors((current) => clearError(current, "website"));
                }
              }}
            />
          </AuthField>
          <AuthField
            id="organization-size"
            label="Organization size"
            error={errors.size}
          >
            <Select
              value={size}
              onValueChange={(value) => {
                setSize(value);
                if (errors.size) {
                  setErrors((current) => clearError(current, "size"));
                }
              }}
            >
              <SelectTrigger
                id="organization-size"
                aria-invalid={Boolean(errors.size)}
                aria-describedby={
                  errors.size ? "organization-size-error" : undefined
                }
              >
                <SelectValue placeholder="Select organization size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10 people</SelectItem>
                <SelectItem value="11-50">11–50 people</SelectItem>
                <SelectItem value="51-200">51–200 people</SelectItem>
                <SelectItem value="201-500">201–500 people</SelectItem>
                <SelectItem value="500-plus">More than 500 people</SelectItem>
              </SelectContent>
            </Select>
          </AuthField>
          <AuthField
            id="primary-use-case"
            label="What will your team use the workspace for?"
            description="Optional"
          >
            <Textarea
              id="primary-use-case"
              name="useCase"
              rows={3}
              maxLength={500}
              value={useCase}
              onChange={(event) => setUseCase(event.target.value)}
            />
          </AuthField>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

type Invitation = { id: number; email: string };

function InviteTeamForm() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: 1, email: "" },
  ]);
  const [errors, setErrors] = useState<Partial<Record<number, string>>>({});
  const [completeCount, setCompleteCount] = useState<number | null>(null);
  const [nextId, setNextId] = useState(2);

  function updateEmail(id: number, email: string) {
    setInvitations((current) =>
      current.map((invitation) =>
        invitation.id === id ? { ...invitation, email } : invitation,
      ),
    );
    setErrors((current) => clearError(current, id));
  }

  function addInvitation() {
    setInvitations((current) => [...current, { id: nextId, email: "" }]);
    setNextId((current) => current + 1);
  }

  function removeInvitation(id: number) {
    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== id),
    );
    setErrors((current) => clearError(current, id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<number, string> = {};
    const emails = invitations
      .map((invitation) => ({
        id: invitation.id,
        email: invitation.email.trim(),
      }))
      .filter((invitation) => invitation.email);

    for (const invitation of emails) {
      const error = getEmailError(invitation.email);
      if (error) {
        nextErrors[invitation.id] = error;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    if (emails.length === 0) {
      router.push("/overview");
      return;
    }
    setCompleteCount(emails.length);
  }

  return (
    <AuthCard
      title="Invite your team"
      description="This step is optional. Add work email addresses or continue to the workspace."
    >
      {completeCount !== null ? (
        <div className="space-y-4">
          <Alert variant="info">
            <AlertTitle>
              {completeCount} email address{completeCount === 1 ? "" : "es"}{" "}
              noted for this demo
            </AlertTitle>
            <AlertDescription>No invitations have been sent.</AlertDescription>
          </Alert>
          <Button
            className="w-full"
            onClick={() => router.push("/overview")}
          >
            Continue to workspace
          </Button>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <div className="space-y-4">
            {invitations.map((invitation, index) => {
              const fieldId = `team-email-${invitation.id}`;
              return (
                <div
                  key={invitation.id}
                  className="flex min-w-0 items-start gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <AuthField
                      id={fieldId}
                      label={`Team email ${index + 1}`}
                      error={errors[invitation.id]}
                    >
                      <Input
                        id={fieldId}
                        name="teamEmail"
                        type="email"
                        autoComplete="email"
                        value={invitation.email}
                        aria-invalid={Boolean(errors[invitation.id])}
                        aria-describedby={
                          errors[invitation.id]
                            ? `${fieldId}-error`
                            : undefined
                        }
                        onChange={(event) =>
                          updateEmail(invitation.id, event.target.value)
                        }
                      />
                    </AuthField>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mt-6 shrink-0"
                    aria-label={`Remove team email ${index + 1}`}
                    onClick={() => removeInvitation(invitation.id)}
                  >
                    <Minus aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addInvitation}
          >
            Add another email
          </Button>
          <Button type="submit" className="w-full">
            Continue to workspace
          </Button>
          <p className="text-center text-body text-muted-foreground">
            <Link
              href="/overview"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Skip this step
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}

export { CreateOrganizationForm, InviteTeamForm };
