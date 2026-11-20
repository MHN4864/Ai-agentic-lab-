import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

type ProgressProps = ProgressPrimitive.Root.Props & {
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
};

function Progress({
  className,
  trackClassName,
  indicatorClassName,
  value,
  min = 0,
  max = 100,
  ...props
}: ProgressProps) {
  const boundedValue =
    value === null ? null : Math.min(max, Math.max(min, value));
  const percentage =
    boundedValue === null || max === min
      ? null
      : ((boundedValue - min) / (max - min)) * 100;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={boundedValue}
      min={min}
      max={max}
      className={cn("w-full", className)}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", trackClassName)}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none data-[status=indeterminate]:w-1/3",
            indicatorClassName,
          )}
          style={percentage === null ? undefined : { width: `${percentage}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
export type { ProgressProps };
