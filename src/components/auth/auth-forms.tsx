"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard, AuthField } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { clearError, getEmailError } from "@/components/auth/validation";
import { cn } from "@/lib/utils";

type SignInErrors = Partial<Record<"email" | "password", string>>;
type SignUpErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "terms", string>
>;

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: SignInErrors = {};
    const emailError = getEmailError(email);
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      router.push("/overview");
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use this demo form to continue to the workspace preview."
    >
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <AuthField id="email" label="Email address" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((current) => clearError(current, "email"));
              }
            }}
          />
        </AuthField>
        <AuthField
          id="password"
          label="Password"
          error={errors.password}
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : undefined
            }
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((current) => clearError(current, "password"));
              }
            }}
          />
        </AuthField>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="remember-me"
            className="flex cursor-pointer items-center gap-2 text-body"
          >
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        New to Ai Agentic Lab?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [complete, setComplete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: SignUpErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Enter your full name.";
    }
    const emailError = getEmailError(email);
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!termsAccepted) {
      nextErrors.terms = "Accept the terms to continue.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setComplete(true);
    }
  }

  function continueToOrganization() {
    router.push("/onboarding/create-organization");
  }

  return (
    <AuthCard
      title="Create an account"
      description="Start with a short demonstration setup. No account is created."
    >
      {complete ? (
        <div className="space-y-4">
          <Alert variant="success">
            <AlertTitle>Details validated for this demo</AlertTitle>
            <AlertDescription>
              No account or password has been created or saved.
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={continueToOrganization}>
            Continue to organization setup
          </Button>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <AuthField id="full-name" label="Full name" error={errors.name}>
            <Input
              id="full-name"
              name="name"
              autoComplete="name"
              required
              value={name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "full-name-error" : undefined}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((current) => clearError(current, "name"));
                }
              }}
            />
          </AuthField>
          <AuthField id="work-email" label="Work email" error={errors.email}>
            <Input
              id="work-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "work-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) {
                  setErrors((current) => clearError(current, "email"));
                }
              }}
            />
          </AuthField>
          <AuthField
            id="new-password"
            label="Password"
            error={errors.password}
            description="Use at least 8 characters."
          >
            <PasswordInput
              id="new-password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? "new-password-error"
                  : "new-password-description"
              }
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => clearError(current, "password"));
                }
              }}
            />
          </AuthField>
          <AuthField
            id="confirm-password"
            label="Confirm password"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              value={confirmPassword}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (errors.confirmPassword) {
                  setErrors((current) =>
                    clearError(current, "confirmPassword"),
                  );
                }
              }}
            />
          </AuthField>
          <div className="space-y-2">
            <label
              htmlFor="accept-terms"
              className="flex cursor-pointer items-start gap-2 text-body"
            >
              <Checkbox
                id="accept-terms"
                checked={termsAccepted}
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? "terms-error" : undefined}
                onCheckedChange={(checked) => {
                  setTermsAccepted(checked === true);
                  if (errors.terms) {
                    setErrors((current) => clearError(current, "terms"));
                  }
                }}
              />
              <span>
                I agree to the terms and understand this is a demonstration.
              </span>
            </label>
            {errors.terms && (
              <p id="terms-error" className="text-error" role="alert">
                {errors.terms}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      )}
      <p className="text-center text-body text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [complete, setComplete] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = getEmailError(email);
    setError(nextError);
    if (!nextError) {
      setComplete(true);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email address to see the password-reset demo."
    >
      {complete ? (
        <div className="space-y-4">
          <Alert variant="info">
            <AlertTitle>Demo request received</AlertTitle>
            <AlertDescription>
              No password reset email was sent.
            </AlertDescription>
          </Alert>
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <AuthField id="reset-email" label="Email address" error={error}>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) {
                  setError(undefined);
                }
              }}
            />
          </AuthField>
          <Button type="submit" className="w-full">
            Submit reset request
          </Button>
        </form>
      )}
      {!complete && (
        <p className="text-center text-body text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Return to sign in
          </Link>
        </p>
      )}
    </AuthCard>
  );
}

export { ForgotPasswordForm, SignInForm, SignUpForm };
