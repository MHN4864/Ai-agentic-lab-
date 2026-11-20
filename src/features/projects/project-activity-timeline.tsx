import {
  Activity,
  CircleDot,
  Flag,
  FolderPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectActivityEvent } from "./types";
import {
  formatActivityTimestamp,
  sortProjectActivity,
} from "./project-utils";

const eventLabels: Record<ProjectActivityEvent["type"], string> = {
  created: "Project created",
  updated: "Project updated",
  status: "Status change",
  milestone: "Milestone",
};

const eventIcons = {
  created: FolderPlus,
  updated: Activity,
  status: CircleDot,
  milestone: Flag,
};

const actorLabels: Record<ProjectActivityEvent["actorType"], string> = {
  human: "Human",
  agent: "Agent",
  system: "System",
};

function ProjectActivityTimeline({
  events,
  emptyMessage = "No project activity has been reported.",
}: {
  events: ProjectActivityEvent[];
  emptyMessage?: string;
}) {
  const sortedEvents = sortProjectActivity(events);

  if (sortedEvents.length === 0) {
    return <p className="text-body text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol aria-label="Project activity timeline" className="space-y-4">
      {sortedEvents.map((event) => {
        const Icon = eventIcons[event.type];

        return (
          <li key={event.id} className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{eventLabels[event.type]}</Badge>
                <Badge variant="secondary">{actorLabels[event.actorType]}</Badge>
              </div>
              <p className="mt-2 break-words text-body">{event.description}</p>
              <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-metadata text-muted-foreground">
                <span className="break-words">{event.actor}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={event.occurredAt}>
                  {formatActivityTimestamp(event.occurredAt)}
                </time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { ProjectActivityTimeline };
