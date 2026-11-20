import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import { ContentContainer } from "@/components/layout";
import { buttonVariants } from "@/components/ui/button";

export default function AgentNotFound() {
  return (
    <ContentContainer>
      <section
        aria-labelledby="agent-not-found-title"
        className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-10 text-center shadow-panel"
      >
        <span className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <h1
          id="agent-not-found-title"
          className="text-card-title font-semibold"
        >
          Agent not found
        </h1>
        <p className="mt-1 max-w-md text-body text-muted-foreground">
          This agent is not part of the current demonstration workspace.
        </p>
        <Link
          href="/agents"
          className={`${buttonVariants({ variant: "outline" })} mt-5`}
        >
          <ArrowLeft aria-hidden="true" />
          Back to Agents
        </Link>
      </section>
    </ContentContainer>
  );
}
