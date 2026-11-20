"use client";

import { Ellipsis, Pause, Pencil, Unplug } from "lucide-react";
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

function AgentActionsMenu({ agentName }: { agentName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${agentName}`}
            title="Agent actions are unavailable in this demo"
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Demo actions</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Pencil aria-hidden="true" />
          Edit agent (not available)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Pause aria-hidden="true" />
          Pause agent (not available)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Unplug aria-hidden="true" />
          Disconnect agent (not available)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AgentActionsMenu };
