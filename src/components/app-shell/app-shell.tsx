"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/config/navigation";
import { WorkspaceSidebar } from "./workspace-sidebar";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentItem = navigationItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    const tabletViewport = window.matchMedia("(min-width: 768px)");
    const closeMobileNavigation = () => {
      if (tabletViewport.matches) {
        setMobileNavigationOpen(false);
      }
    };

    tabletViewport.addEventListener("change", closeMobileNavigation);
    return () =>
      tabletViewport.removeEventListener("change", closeMobileNavigation);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex min-h-svh bg-background">
        <aside
          aria-label="Workspace sidebar"
          className={cn(
            "sticky top-0 hidden h-svh w-[4.5rem] shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:block xl:w-64",
            sidebarCollapsed && "xl:w-[4.5rem]",
          )}
        >
          <WorkspaceSidebar collapsed={sidebarCollapsed} />
        </aside>

        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-control text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring/40"
          >
            Skip to content
          </a>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 sm:px-4 md:gap-3 md:px-5 xl:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileNavigationOpen}
                onClick={() => setMobileNavigationOpen(true)}
              >
                <Menu aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden xl:inline-flex"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen aria-hidden="true" />
                ) : (
                  <PanelLeftClose aria-hidden="true" />
                )}
              </Button>
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 text-secondary">
                  <li className="hidden truncate text-muted-foreground sm:block">
                    Workspace preview
                  </li>
                  <li className="hidden sm:block" aria-hidden="true">
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </li>
                  <li
                    aria-current="page"
                    className="min-w-0 truncate font-medium text-foreground"
                  >
                    {currentItem?.label ?? "Workspace"}
                  </li>
                </ol>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      aria-label="Notifications (preview)"
                      title="Notifications are a preview placeholder"
                    >
                      <Bell aria-hidden="true" />
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 size-1.5 rounded-full bg-muted-foreground"
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <p className="px-2 py-2 text-secondary text-muted-foreground">
                    Notifications are not connected in this preview.
                  </p>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="h-9 gap-2 px-2"
                      aria-label="Account options"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <span className="hidden text-secondary font-medium sm:inline">
                        Account
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <span className="block">Preview account</span>
                      <span className="mt-1 block font-normal text-muted-foreground">
                        Account actions are not connected.
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <UserRound aria-hidden="true" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled variant="destructive">
                    <LogOut aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
        </div>

        <Dialog.Root
          modal
          open={mobileNavigationOpen}
          onOpenChange={(open) => setMobileNavigationOpen(open)}
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/30 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
            <Dialog.Popup className="fixed inset-y-0 left-0 z-50 h-dvh w-[min(18rem,calc(100vw-2.5rem))] border-r border-sidebar-border bg-sidebar shadow-lg outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left motion-reduce:animate-none">
              <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
              <Dialog.Description className="sr-only">
                Navigate between workspace sections.
              </Dialog.Description>
              <WorkspaceSidebar
                mobile
                onNavigate={() => setMobileNavigationOpen(false)}
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </TooltipProvider>
  );
}

export { AppShell };
