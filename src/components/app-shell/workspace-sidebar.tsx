"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Building2,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigationGroups, type NavigationItem } from "@/config/navigation";

type WorkspaceSidebarProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

function NavigationLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-2.5 text-secondary font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "h-11 w-full justify-start gap-2.5 px-2 text-left hover:bg-accent",
              collapsed && "h-10 justify-center px-0",
            )}
            aria-label="Workspace preview options"
            title={collapsed ? "Workspace preview options" : undefined}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <span className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
              <span className="block truncate text-control font-semibold text-foreground">
                Workspace preview
              </span>
              <span className="block truncate text-metadata text-muted-foreground">
                Demo only
              </span>
            </span>
            <ChevronDown
              className={cn("size-4 shrink-0 text-muted-foreground", collapsed && "sr-only")}
              aria-hidden="true"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspace preview</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <Building2 aria-hidden="true" />
            Demo workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-secondary text-muted-foreground">
          Workspace switching is not available in this preview.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceSidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [tabletCompact, setTabletCompact] = useState(false);

  useEffect(() => {
    const tabletViewport = window.matchMedia(
      "(min-width: 768px) and (max-width: 1279px)",
    );
    const updateCompactMode = () => setTabletCompact(tabletViewport.matches);

    updateCompactMode();
    tabletViewport.addEventListener("change", updateCompactMode);
    return () =>
      tabletViewport.removeEventListener("change", updateCompactMode);
  }, []);

  const isCollapsed = collapsed || (!mobile && tabletCompact);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 p-3">
        <WorkspaceSwitcher collapsed={isCollapsed} />
        {mobile && (
          <Dialog.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Close navigation"
              >
                <PanelLeftClose aria-hidden="true" />
              </Button>
            }
          />
        )}
      </div>
      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
      >
        {navigationGroups.map((group, groupIndex) => (
          <div
            key={group.label}
            role="group"
            aria-labelledby={`navigation-${group.label.toLowerCase()}`}
            className={cn(groupIndex > 0 && (isCollapsed ? "mt-3" : "mt-5"))}
          >
            {isCollapsed && groupIndex > 0 && (
              <div className="mx-auto mb-3 h-px w-8 bg-sidebar-border" />
            )}
            <h2
              id={`navigation-${group.label.toLowerCase()}`}
              className={cn(
                "mb-2 px-2.5 text-metadata font-semibold tracking-wide text-muted-foreground",
                isCollapsed && "sr-only",
              )}
            >
              {group.label}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavigationLink
                    item={item}
                    active={
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                    }
                    collapsed={isCollapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <p className={cn("text-metadata text-muted-foreground", isCollapsed && "sr-only")}>
          Customer-owned agents · preview
        </p>
      </div>
    </div>
  );
}

export { WorkspaceSidebar };
