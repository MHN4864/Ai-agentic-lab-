import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { WorkforceDirectoryProvider } from "@/features/members/workforce-directory-context";
import { ProjectsProvider } from "@/features/projects/projects-context";
import { ReviewsProvider } from "@/features/reviews/reviews-context";
import { TasksProvider } from "@/features/tasks/tasks-context";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <ProjectsProvider>
      <WorkforceDirectoryProvider>
        <TasksProvider>
          <ReviewsProvider>
            <AppShell>{children}</AppShell>
          </ReviewsProvider>
        </TasksProvider>
      </WorkforceDirectoryProvider>
    </ProjectsProvider>
  );
}
