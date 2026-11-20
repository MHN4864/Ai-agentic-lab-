import { notFound } from "next/navigation";
import { ContentContainer, PageHeader } from "@/components/layout";
import { navigationItems } from "@/config/navigation";
import { AgentRegistry } from "@/features/agents/agent-registry";
import { AnalyticsDashboard } from "@/features/analytics/analytics-dashboard";
import { MonitoringDashboard } from "@/features/monitoring/monitoring-dashboard";
import { OverviewDashboard } from "@/features/overview/overview-dashboard";
import { UsageDashboard } from "@/features/usage-costs/usage-dashboard";

export default async function WorkspaceSectionPage({
  params,
}: PageProps<"/[section]">) {
  const { section } = await params;
  const item = navigationItems.find((navigationItem) => navigationItem.href === `/${section}`);

  if (!item) {
    notFound();
  }

  if (section === "overview") {
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    return (
      <ContentContainer>
        <OverviewDashboard dateLabel={dateLabel} />
      </ContentContainer>
    );
  }

  if (section === "agents") {
    return (
      <ContentContainer>
        <AgentRegistry />
      </ContentContainer>
    );
  }

  if (section === "monitoring") {
    return (
      <ContentContainer>
        <MonitoringDashboard />
      </ContentContainer>
    );
  }

  if (section === "analytics") {
    return (
      <ContentContainer>
        <AnalyticsDashboard />
      </ContentContainer>
    );
  }

  if (section === "usage") {
    return (
      <ContentContainer>
        <UsageDashboard />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <PageHeader
        title={item.label}
        description="This area is not implemented yet."
      />
    </ContentContainer>
  );
}
