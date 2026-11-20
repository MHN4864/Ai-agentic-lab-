import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ContentContainerProps = ComponentProps<"div"> & {
  density?: "default" | "compact";
};

function ContentContainer({
  className,
  density = "default",
  ...props
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 md:px-6 xl:px-8",
        density === "default" ? "py-6 sm:py-8" : "py-4 sm:py-6",
        className,
      )}
      {...props}
    />
  );
}

export { ContentContainer };
