import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
};

function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
      aria-label={title}
    >
      {Icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <h2 className="text-card-title font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-secondary text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

export { EmptyState };
export type { EmptyStateProps };
