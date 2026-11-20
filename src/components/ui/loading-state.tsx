import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  children?: ReactNode;
  className?: string;
};

function LoadingState({
  label = "Loading",
  children,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn("space-y-3", className)}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { LoadingState };
export type { LoadingStateProps };
