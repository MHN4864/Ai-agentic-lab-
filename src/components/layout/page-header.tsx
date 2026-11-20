import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-metadata font-medium text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="break-words text-page-title font-semibold tracking-tight [overflow-wrap:anywhere]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl break-words text-muted-foreground [overflow-wrap:anywhere]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex max-w-full flex-wrap items-center gap-2 md:max-w-[45%] md:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

export { PageHeader };
export type { PageHeaderProps };
