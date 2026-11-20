import Link from "next/link";
import {
  ArrowUpRight,
  CircleAlert,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { AnalyticsInsight } from "./types";

const insightTones: Record<AnalyticsInsight["tone"], StatusTone> = {
  info: "neutral",
  attention: "attention",
  critical: "critical",
};

const insightIcons = {
  info: Info,
  attention: CircleAlert,
  critical: CircleAlert,
};

function AnalyticsInsights({ insights }: { insights: AnalyticsInsight[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-card-title font-semibold">
            Reliability & bottlenecks
          </h2>
          <p className="text-metadata text-muted-foreground">
            Findings are calculated from the selected sample. Sparse records
            are called out rather than treated as historical trends.
          </p>
        </div>
      </CardHeader>
      <CardContent className="border-t border-border pt-4">
        <ul className="divide-y divide-border">
          {insights.map((insight) => {
            const Icon = insightIcons[insight.tone];
            const content = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {insight.title}
                    </span>
                    <StatusBadge
                      tone={insightTones[insight.tone]}
                      category="Insight"
                    >
                      {insight.tone === "info"
                        ? "Informational"
                        : insight.tone === "attention"
                          ? "Attention"
                          : "Critical"}
                    </StatusBadge>
                  </span>
                  <span className="mt-1 block break-words text-body text-muted-foreground">
                    {insight.description}
                  </span>
                </span>
                {insight.href && (
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </>
            );

            return (
              <li key={insight.id} className="py-3 first:pt-0 last:pb-0">
                {insight.href ? (
                  <Link
                    href={insight.href}
                    className="flex min-w-0 items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-w-0 items-start gap-3">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export { AnalyticsInsights };
