"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function Avatar({ className, ...props }: AvatarPrimitive.Root.Props) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative inline-flex size-8 shrink-0 overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-metadata font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({
  "aria-label": ariaLabel = "Team members",
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center -space-x-2 [&_[data-slot=avatar]]:size-8 [&_[data-slot=avatar]]:border-2 [&_[data-slot=avatar]]:border-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <Badge
      data-slot="avatar-group-count"
      variant="secondary"
      className={cn(
        "size-8 rounded-full border-2 border-background px-0 text-metadata",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
