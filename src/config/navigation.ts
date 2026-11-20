import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  ClipboardCheck,
  Coins,
  FolderKanban,
  House,
  ListTodo,
  Monitor,
  Plug,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href:
    | "/overview"
    | "/agents"
    | "/monitoring"
    | "/projects"
    | "/tasks"
    | "/reviews"
    | "/executions"
    | "/analytics"
    | "/usage"
    | "/governance"
    | "/integrations"
    | "/members"
    | "/teams"
    | "/settings";
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", href: "/overview", icon: House },
      { label: "Agents", href: "/agents", icon: Bot },
      { label: "Monitoring", href: "/monitoring", icon: Monitor },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Tasks", href: "/tasks", icon: ListTodo },
      { label: "Reviews", href: "/reviews", icon: ClipboardCheck },
      { label: "Executions", href: "/executions", icon: Activity },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
      { label: "Usage & Costs", href: "/usage", icon: Coins },
      { label: "Governance", href: "/governance", icon: ShieldCheck },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      { label: "Integrations", href: "/integrations", icon: Plug },
      { label: "Members & Teams", href: "/members", icon: UsersRound },
      { label: "Teams", href: "/teams", icon: UsersRound },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const navigationItems = navigationGroups.flatMap((group) => group.items);

export { navigationGroups, navigationItems };
export type { NavigationGroup, NavigationItem };
