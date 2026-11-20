import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
};

function SectionHeader({
  title,
  description,
  actions,
  className,
  headingLevel = 2,
}: SectionHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="break-words text-section-title font-semibold tracking-tight [overflow-wrap:anywhere]">
          {title}
        </Heading>
        {description && (
          <p className="mt-1 break-words text-secondary text-muted-foreground [overflow-wrap:anywhere]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex max-w-full flex-wrap items-center gap-2 md:max-w-[45%] md:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };
