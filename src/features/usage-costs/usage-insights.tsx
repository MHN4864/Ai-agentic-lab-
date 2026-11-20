import { Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { UsageInsight } from "./types";

function UsageInsights({ insights }: { insights: UsageInsight[] }) {
  return (
    <section aria-labelledby="usage-insights-heading" className="space-y-3">
      <div>
        <h2
          id="usage-insights-heading"
          className="text-section-title font-semibold"
        >
          Usage insights
        </h2>
        <p className="text-body text-muted-foreground">
          Descriptive observations from the selected sample only. These are not
          billing alerts or savings recommendations.
        </p>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="min-w-0 gap-0 py-0">
            <CardHeader className="flex-row items-start justify-between gap-3 p-4 pb-0">
              <h3 className="min-w-0 text-control font-medium">
                {insight.title}
              </h3>
              <StatusBadge tone="neutral" category="Insight">
                {insight.value === "Unavailable" ? "Unavailable" : "Sample"}
              </StatusBadge>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="break-words text-lg font-semibold">
                {insight.value}
              </p>
              <p className="mt-1 break-words text-metadata text-muted-foreground">
                {insight.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-info/25 bg-info/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info
            className="mt-0.5 size-4 shrink-0 text-info"
            aria-hidden="true"
          />
          <p className="text-body text-muted-foreground">
            Cost share and average cost calculations use only executions with
            an explicit demonstration estimate. Request counts use recorded
            model-response events; neither measure represents a provider
            invoice.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export { UsageInsights };
