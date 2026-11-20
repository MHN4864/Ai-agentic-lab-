"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CircleAlert,
  FilterX,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkforceDirectory } from "./workforce-directory-context";
import {
  formatMemberTimestamp,
  getMemberActivity,
  getMemberAssignedTasks,
  getMemberOwnedProjects,
} from "./member-utils";
import { monitoringEventDemoData } from "@/features/monitoring/demo-data";
import { useProjects } from "@/features/projects/projects-context";
import {
  ProjectPriorityBadge,
  ProjectStatusBadge,
} from "@/features/projects/project-badges";
import { useReviews } from "@/features/reviews/reviews-context";
import { useTasks } from "@/features/tasks/tasks-context";
import { TaskStatusBadge } from "@/features/tasks/task-badges";
import type { MembershipStatus, MemberFormValues } from "./types";

type MemberSortKey = "name" | "roleTitle" | "team" | "status" | "tasks";

function isMemberSortKey(value: string): value is MemberSortKey {
  return ["name", "roleTitle", "team", "status", "tasks"].includes(value);
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return value === "active" || value === "invited" || value === "suspended";
}

const memberStatusLabels: Record<MembershipStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

const memberStatusTones = {
  active: "operational",
  invited: "attention",
  suspended: "critical",
} as const;

function MemberStatus({ status }: { status: MembershipStatus }) {
  return (
    <StatusBadge tone={memberStatusTones[status]} category="Membership status">
      {memberStatusLabels[status]}
    </StatusBadge>
  );
}

function DirectoryNavigation({ active }: { active: "members" | "teams" }) {
  return (
    <nav aria-label="Members and teams" className="flex flex-wrap gap-2">
      <Link
        href="/members"
        aria-current={active === "members" ? "page" : undefined}
        className={`inline-flex min-h-9 items-center rounded-md px-3 text-control font-medium ${
          active === "members"
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-surface text-muted-foreground hover:text-foreground"
        }`}
      >
        Members
      </Link>
      <Link
        href="/teams"
        aria-current={active === "teams" ? "page" : undefined}
        className={`inline-flex min-h-9 items-center rounded-md px-3 text-control font-medium ${
          active === "teams"
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-surface text-muted-foreground hover:text-foreground"
        }`}
      >
        Teams
      </Link>
    </nav>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof UsersRound;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-body text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-metadata text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MemberTaskCount(memberId: string, tasks: ReturnType<typeof useTasks>["tasks"]) {
  return getMemberAssignedTasks(memberId, tasks).length;
}

function MembersRegistry() {
  const { members, teams } = useWorkforceDirectory();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { reviews } = useReviews();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [sortKey, setSortKey] = useState<MemberSortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const counts = {
    total: members.length,
    active: members.filter((member) => member.status === "active").length,
    invited: members.filter((member) => member.status === "invited").length,
    suspended: members.filter((member) => member.status === "suspended").length,
  };

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return members
      .filter((member) => {
        const searchable = `${member.name} ${member.email}`.toLocaleLowerCase();
        return (
          (!normalizedQuery || searchable.includes(normalizedQuery)) &&
          (!statusFilter || member.status === statusFilter) &&
          (!teamFilter || member.teamId === teamFilter)
        );
      })
      .sort((first, second) => {
        let comparison = 0;
        switch (sortKey) {
          case "name":
            comparison = first.name.localeCompare(second.name);
            break;
          case "roleTitle":
            comparison = first.roleTitle.localeCompare(second.roleTitle);
            break;
          case "team":
            comparison = (first.team ?? "").localeCompare(second.team ?? "");
            break;
          case "status":
            comparison = first.status.localeCompare(second.status);
            break;
          case "tasks":
            comparison =
              MemberTaskCount(first.id, tasks) - MemberTaskCount(second.id, tasks);
            break;
        }
        return comparison * (sortDirection === "asc" ? 1 : -1);
      });
  }, [members, query, sortDirection, sortKey, statusFilter, tasks, teamFilter]);

  const hasFilters = Boolean(query || statusFilter || teamFilter);
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setTeamFilter("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage the people who collaborate with your connected agent workforce."
      />
      <DirectoryNavigation active="members" />
      <Alert>
        <AlertDescription>
          Demonstration workspace data only. Invitations do not send email or
          create accounts, and membership status is not access control.
        </AlertDescription>
      </Alert>

      <section aria-label="Member summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total members" value={counts.total} description="People in this demo directory" icon={UsersRound} />
        <SummaryCard title="Active" value={counts.active} description="Marked active in demo data" icon={UserRound} />
        <SummaryCard title="Invited" value={counts.invited} description="No external invitation sent" icon={UserRound} />
        <SummaryCard title="Suspended" value={counts.suspended} description="Status label only; no access enforcement" icon={UserRound} />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-card-title font-semibold">People directory</h2>
              <p className="text-metadata text-muted-foreground">
                Search, filter, and sort human workforce participants.
              </p>
            </div>
            <Link href="/members/new" className={buttonVariants()}>
              <Plus aria-hidden="true" />
              Add member
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 space-y-1.5 xl:col-span-2">
              <Label htmlFor="member-search">Search members</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="member-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or email"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="member-status-filter">Status</Label>
              <select id="member-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control">
                <option value="">All statuses</option>
                {Object.entries(memberStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="member-team-filter">Team</Label>
              <select id="member-team-filter" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control">
                <option value="">All teams</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-sort">Sort by</Label>
                <select id="member-sort" value={sortKey} onChange={(event) => { if (isMemberSortKey(event.target.value)) setSortKey(event.target.value); }} className="h-9 rounded-md border border-input bg-surface px-3 text-control">
                  <option value="name">Name</option>
                  <option value="roleTitle">Role/title</option>
                  <option value="team">Team</option>
                  <option value="status">Status</option>
                  <option value="tasks">Assigned tasks</option>
                </select>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSortDirection((direction) => direction === "asc" ? "desc" : "asc")} aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}>
                {sortDirection === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                {sortDirection === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
            <p className="text-metadata text-muted-foreground" aria-live="polite">
              {filteredMembers.length} of {members.length} members
            </p>
          </div>

          {filteredMembers.length ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role / title</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned tasks</TableHead>
                    <TableHead>Owned projects</TableHead>
                    <TableHead>Last active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const activity = getMemberActivity(member, tasks, projects, reviews, monitoringEventDemoData);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="min-w-52">
                          <Link href={`/members/${member.id}`} className="font-medium text-primary hover:underline">{member.name}</Link>
                          <p className="mt-0.5 text-metadata text-muted-foreground">{member.email}</p>
                        </TableCell>
                        <TableCell className="min-w-40">{member.roleTitle}</TableCell>
                        <TableCell className="min-w-36">
                          {member.teamId ? <Link href={`/teams/${member.teamId}`} className="text-primary hover:underline">{member.team}</Link> : <span className="text-muted-foreground">Not assigned</span>}
                        </TableCell>
                        <TableCell><MemberStatus status={member.status} /></TableCell>
                        <TableCell className="tabular-nums">{MemberTaskCount(member.id, tasks)}</TableCell>
                        <TableCell className="tabular-nums">{getMemberOwnedProjects(member, projects).length}</TableCell>
                        <TableCell className="min-w-40 text-metadata text-muted-foreground">{activity[0] ? formatMemberTimestamp(activity[0].occurredAt) : "Not reported"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : hasFilters ? (
            <EmptyState title="No members match these filters" description="Try another search or clear the selected filters." icon={FilterX} action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <EmptyState title="No members yet" description="Add a member to this demonstration directory." icon={UsersRound} action={<Link href="/members/new" className={buttonVariants()}>Add member</Link>} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberFormPage({
  memberId,
}: {
  memberId?: string;
}) {
  const router = useRouter();
  const { members, teams, createMember, updateMember } = useWorkforceDirectory();
  const member = memberId ? members.find((candidate) => candidate.id === memberId) : undefined;
  const isEditing = Boolean(memberId);
  const [values, setValues] = useState<MemberFormValues>(() => ({
    name: member?.name ?? "",
    email: member?.email ?? "",
    roleTitle: member?.roleTitle ?? "",
    status: member?.status ?? "invited",
    teamId: member?.teamId ?? "",
  }));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isEditing && !member) {
    return (
      <EmptyState
        title="Member not found"
        description="This member is not part of the current demonstration directory."
        icon={CircleAlert}
        action={<Link href="/members" className={buttonVariants({ variant: "outline" })}><ArrowLeft aria-hidden="true" />Back to members</Link>}
      />
    );
  }

  function updateValue<Key extends keyof MemberFormValues>(key: Key, value: MemberFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const name = values.name.trim();
    const email = values.email.trim().toLocaleLowerCase();
    const roleTitle = values.roleTitle.trim();
    if (!name || !roleTitle || !email) {
      setError("Enter a name, valid email address, and role or title.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const duplicateEmail = members.some((candidate) => candidate.id !== memberId && candidate.email.toLocaleLowerCase() === email);
    const duplicateName = members.some((candidate) => candidate.id !== memberId && candidate.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicateEmail || duplicateName) {
      setError(duplicateEmail ? "A member with this email already exists." : "A member with this name already exists.");
      return;
    }
    setIsSubmitting(true);
    const normalizedValues = { ...values, name, email, roleTitle };
    const savedMember = memberId
      ? updateMember(memberId, normalizedValues)
      : createMember(normalizedValues);
    if (!savedMember) {
      setIsSubmitting(false);
      setError("The selected team or member is no longer available. Review your selections and try again.");
      return;
    }
    router.push(`/members/${savedMember.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={memberId ? `/members/${memberId}` : "/members"} className="inline-flex min-h-8 items-center gap-2 text-control font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {memberId ? "Back to member" : "Back to members"}
      </Link>
      <PageHeader
        title={memberId ? "Edit member" : "Add member"}
        description={memberId ? "Update this demonstration directory record." : "Add a person to the local demonstration directory."}
      />
      <Alert>
        <AlertDescription>
          Demo-only behavior. Choosing Invited does not send an email or create
          an authentication account.
        </AlertDescription>
      </Alert>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="member-name">Name</Label>
                <Input id="member-name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} required autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-email">Email</Label>
                <Input id="member-email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-role">Role / title</Label>
                <Input id="member-role" value={values.roleTitle} onChange={(event) => updateValue("roleTitle", event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-team">Team</Label>
                <select id="member-team" value={values.teamId} onChange={(event) => updateValue("teamId", event.target.value)} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control">
                  <option value="">No team</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="member-status">Membership status</Label>
                <select id="member-status" value={values.status} onChange={(event) => { if (isMembershipStatus(event.target.value)) updateValue("status", event.target.value); }} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control sm:max-w-xs">
                  {Object.entries(memberStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <p className="text-metadata text-muted-foreground">Status is descriptive demonstration data, not an access-control setting.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Link href={memberId ? `/members/${memberId}` : "/members"} className={buttonVariants({ variant: "outline" })}>Cancel</Link>
              <Button type="submit" disabled={isSubmitting}>{memberId ? "Save changes" : "Add member"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberProfile({ memberId }: { memberId: string }) {
  const { members, teams } = useWorkforceDirectory();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { reviews } = useReviews();
  const member = members.find((candidate) => candidate.id === memberId);
  if (!member) {
    return (
      <EmptyState title="Member not found" description="This member is not part of the current demonstration directory." icon={CircleAlert} action={<Link href="/members" className={buttonVariants({ variant: "outline" })}><ArrowLeft aria-hidden="true" />Back to members</Link>} />
    );
  }
  const team = teams.find((candidate) => candidate.id === member.teamId);
  const memberTasks = getMemberAssignedTasks(member.id, tasks);
  const ownedProjects = getMemberOwnedProjects(member, projects);
  const activity = getMemberActivity(member, tasks, projects, reviews, monitoringEventDemoData);

  return (
    <div className="space-y-6">
      <Link href="/members" className="inline-flex min-h-8 items-center gap-2 text-control font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />Back to members
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={member.name} description={`${member.roleTitle} · ${member.email}`} />
        <Link href={`/members/${member.id}/edit`} className={buttonVariants({ variant: "outline" })}>Edit member</Link>
      </div>
      <Alert><AlertDescription>Demonstration directory record. Membership status and profile changes are local to this session and do not provision accounts or enforce permissions.</AlertDescription></Alert>
      <div className="flex flex-wrap items-center gap-2">
        <MemberStatus status={member.status} />
        {team ? <Link href={`/teams/${team.id}`} className="rounded-full border border-border px-3 py-1 text-metadata hover:bg-muted">{team.name}</Link> : <span className="text-metadata text-muted-foreground">No team assigned</span>}
      </div>
      <section aria-label="Member workload summary" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard title="Assigned tasks" value={memberTasks.length} description="Primary and collaborator assignments" icon={UserRound} />
        <SummaryCard title="Owned projects" value={ownedProjects.length} description="Based on existing project owner references" icon={UsersRound} />
        <Card className="min-w-0 gap-0 py-0"><CardContent className="p-4"><p className="text-body text-muted-foreground">Last active</p><p className="mt-2 text-control font-semibold">{activity[0] ? formatMemberTimestamp(activity[0].occurredAt) : "Not reported"}</p><p className="mt-2 text-metadata text-muted-foreground">Only shown when existing activity identifies this member.</p></CardContent></Card>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader><div><h2 className="text-card-title font-semibold">Assigned tasks</h2><p className="text-metadata text-muted-foreground">Existing tasks linked by member ID.</p></div></CardHeader>
          <CardContent>
            {memberTasks.length ? <div className="space-y-2">{memberTasks.map((task) => {
              const isPrimary = task.assignment.primaryAssignee?.type === "human" && task.assignment.primaryAssignee.memberId === member.id;
              return <div key={task.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="min-w-0"><Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">{task.title}</Link><p className="text-metadata text-muted-foreground">{task.id} · {isPrimary ? "Primary assignee" : "Collaborator"}</p></div>
                <TaskStatusBadge status={task.status} />
              </div>;
            })}</div> : <EmptyState title="No assigned tasks" description="No existing tasks reference this member as a primary assignee or collaborator." icon={UserRound} />}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader><div><h2 className="text-card-title font-semibold">Owned projects</h2><p className="text-metadata text-muted-foreground">Existing projects associated with this member as owner.</p></div></CardHeader>
          <CardContent>
            {ownedProjects.length ? <div className="space-y-2">{ownedProjects.map((project) => <div key={project.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0"><Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">{project.name}</Link><p className="text-metadata text-muted-foreground">{project.id}</p></div>
              <div className="flex flex-wrap items-center gap-2"><ProjectPriorityBadge priority={project.priority} /><ProjectStatusBadge status={project.status} /></div>
            </div>)}</div> : <EmptyState title="No owned projects" description="No existing project owner reference matches this member." icon={UsersRound} />}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader><div><h2 className="text-card-title font-semibold">Recent activity</h2><p className="text-metadata text-muted-foreground">Derived from existing task, project, review, and monitoring records.</p></div></CardHeader>
        <CardContent>
          {activity.length ? <ol className="space-y-0">{activity.slice(0, 12).map((item) => <li key={item.id} className="relative flex gap-3 border-l border-border pb-5 pl-5 last:border-l-transparent last:pb-0">
            <span className="absolute -left-1.25 top-1 size-2 rounded-full border border-background bg-primary" />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-control font-medium">{item.label}</span><time dateTime={item.occurredAt} className="text-metadata text-muted-foreground">{formatMemberTimestamp(item.occurredAt)}</time></div><p className="mt-1 text-body">{item.href ? <Link href={item.href} className="hover:text-primary hover:underline">{item.description}</Link> : item.description}</p></div>
          </li>)}</ol> : <EmptyState title="No member activity reported" description="The demonstration records do not identify activity for this member." icon={CircleAlert} />}
        </CardContent>
      </Card>
    </div>
  );
}

export { DirectoryNavigation, MemberFormPage, MemberProfile, MembersRegistry, MemberStatus, memberStatusLabels };
