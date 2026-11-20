"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
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
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkforceDirectory } from "@/features/members/workforce-directory-context";
import { DirectoryNavigation, MemberStatus } from "@/features/members/members-pages";
import { useProjects } from "@/features/projects/projects-context";
import { ProjectStatusBadge } from "@/features/projects/project-badges";
import { useTasks } from "@/features/tasks/tasks-context";
import { TaskStatusBadge } from "@/features/tasks/task-badges";
import type { MemberFormValues } from "@/features/members/types";
import type { TeamFormValues, WorkspaceTeam } from "./types";

type TeamSortKey = "name" | "members" | "projects" | "tasks";

function isTeamSortKey(value: string): value is TeamSortKey {
  return ["name", "members", "projects", "tasks"].includes(value);
}

function getTeamProjects(team: WorkspaceTeam, projects: ReturnType<typeof useProjects>["projects"]) {
  return projects.filter((project) => project.team && team.projectTeamNames.includes(project.team));
}

function TeamSummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardContent className="p-4">
        <p className="text-body text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-2 text-metadata text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function TeamsRegistry() {
  const { members, teams } = useWorkforceDirectory();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<TeamSortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const teamStats = useCallback(
    (team: WorkspaceTeam) => {
      const teamMembers = members.filter((member) => member.teamId === team.id);
      const teamProjects = getTeamProjects(team, projects);
      const projectIds = new Set(teamProjects.map((project) => project.id));
      const teamTasks = tasks.filter((task) => projectIds.has(task.projectId));
      return {
        members: teamMembers.length,
        activeProjects: teamProjects.filter((project) => project.status === "active").length,
        tasks: teamTasks.length,
        lead: members.find((member) => member.id === team.leadMemberId),
      };
    },
    [members, projects, tasks],
  );

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return teams
      .filter((team) => `${team.name} ${team.description}`.toLocaleLowerCase().includes(normalizedQuery))
      .sort((first, second) => {
        const firstStats = teamStats(first);
        const secondStats = teamStats(second);
        let comparison = 0;
        switch (sortKey) {
          case "name":
            comparison = first.name.localeCompare(second.name);
            break;
          case "members":
            comparison = firstStats.members - secondStats.members;
            break;
          case "projects":
            comparison = firstStats.activeProjects - secondStats.activeProjects;
            break;
          case "tasks":
            comparison = firstStats.tasks - secondStats.tasks;
            break;
        }
        return comparison * (sortDirection === "asc" ? 1 : -1);
      });
  }, [query, sortDirection, sortKey, teamStats, teams]);

  const assignedMembers = members.filter((member) => teams.some((team) => team.id === member.teamId)).length;
  const activeProjects = projects.filter((project) => project.status === "active" && teams.some((team) => project.team && team.projectTeamNames.includes(project.team))).length;
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status) && projects.some((project) => project.id === task.projectId && teams.some((team) => project.team && team.projectTeamNames.includes(project.team)))).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Teams" description="Organize people and relate teams to their existing project and task workload." />
      <DirectoryNavigation active="teams" />
      <Alert><AlertDescription>Team membership and metrics are demonstration data. Project association uses the existing project team label; this page does not enforce access or permissions.</AlertDescription></Alert>
      <section aria-label="Team summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamSummaryCard title="Teams" value={teams.length} description="Teams in this demo directory" />
        <TeamSummaryCard title="Assigned members" value={assignedMembers} description="Members associated with a team" />
        <TeamSummaryCard title="Active projects" value={activeProjects} description="Existing projects with a matching team label" />
        <TeamSummaryCard title="Open task workload" value={openTasks} description="Non-completed tasks in associated projects" />
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-card-title font-semibold">Team directory</h2><p className="text-metadata text-muted-foreground">Derived membership, project, and task counts.</p></div>
            <Link href="/teams/new" className={buttonVariants()}><Plus aria-hidden="true" />Create team</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="team-search">Search teams</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="team-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Team name or description" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5"><Label htmlFor="team-sort">Sort by</Label><select id="team-sort" value={sortKey} onChange={(event) => { if (isTeamSortKey(event.target.value)) setSortKey(event.target.value); }} className="h-9 rounded-md border border-input bg-surface px-3 text-control"><option value="name">Name</option><option value="members">Member count</option><option value="projects">Active projects</option><option value="tasks">Task workload</option></select></div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSortDirection((direction) => direction === "asc" ? "desc" : "asc")} aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}>
                {sortDirection === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                {sortDirection === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
          <p className="text-metadata text-muted-foreground" aria-live="polite">{filteredTeams.length} of {teams.length} teams</p>
          {filteredTeams.length ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>Lead</TableHead><TableHead>Members</TableHead><TableHead>Active projects</TableHead><TableHead>Task workload</TableHead></TableRow></TableHeader>
                <TableBody>{filteredTeams.map((team) => {
                  const stats = teamStats(team);
                  return <TableRow key={team.id}>
                    <TableCell className="min-w-56"><Link href={`/teams/${team.id}`} className="font-medium text-primary hover:underline">{team.name}</Link><p className="mt-0.5 max-w-sm text-metadata text-muted-foreground">{team.description}</p></TableCell>
                    <TableCell className="min-w-40">{stats.lead ? <Link href={`/members/${stats.lead.id}`} className="text-primary hover:underline">{stats.lead.name}</Link> : <span className="text-muted-foreground">Not assigned</span>}</TableCell>
                    <TableCell className="tabular-nums">{stats.members}</TableCell>
                    <TableCell className="tabular-nums">{stats.activeProjects}</TableCell>
                    <TableCell className="tabular-nums">{stats.tasks}</TableCell>
                  </TableRow>;
                })}</TableBody>
              </Table>
            </div>
          ) : query ? <EmptyState title="No teams match this search" description="Try another team name or description." icon={FilterX} action={<Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>} /> : <EmptyState title="No teams yet" description="Create a team to organize existing members and project labels." icon={UsersRound} action={<Link href="/teams/new" className={buttonVariants()}>Create team</Link>} />}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamFormPage({ teamId }: { teamId?: string }) {
  const router = useRouter();
  const { members, teams, createTeam, updateTeam } = useWorkforceDirectory();
  const team = teamId ? teams.find((candidate) => candidate.id === teamId) : undefined;
  const isEditing = Boolean(teamId);
  const [values, setValues] = useState<TeamFormValues>(() => ({
    name: team?.name ?? "",
    description: team?.description ?? "",
    leadMemberId: team?.leadMemberId ?? "",
  }));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isEditing && !team) {
    return <EmptyState title="Team not found" description="This team is not part of the current demonstration directory." icon={CircleAlert} action={<Link href="/teams" className={buttonVariants({ variant: "outline" })}><ArrowLeft aria-hidden="true" />Back to teams</Link>} />;
  }

  function updateValue<Key extends keyof TeamFormValues>(key: Key, value: TeamFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const name = values.name.trim();
    if (!name || !values.description.trim()) {
      setError("Enter a team name and description.");
      return;
    }
    if (teams.some((candidate) => candidate.id !== teamId && candidate.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError("A team with this name already exists.");
      return;
    }
    setIsSubmitting(true);
    const savedTeam = teamId
      ? updateTeam(teamId, { ...values, name, description: values.description.trim() })
      : createTeam({ ...values, name, description: values.description.trim() });
    if (!savedTeam) {
      setIsSubmitting(false);
      setError("The selected lead is no longer available. Review your selection and try again.");
      return;
    }
    router.push(`/teams/${savedTeam.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={teamId ? `/teams/${teamId}` : "/teams"} className="inline-flex min-h-8 items-center gap-2 text-control font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />{teamId ? "Back to team" : "Back to teams"}</Link>
      <PageHeader title={teamId ? "Edit team" : "Create team"} description="Update the local demonstration team directory." />
      <Alert><AlertDescription>Team edits are demonstration-only and do not change access permissions or persist to a backend.</AlertDescription></Alert>
      <Card><CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-1.5"><Label htmlFor="team-name">Team name</Label><Input id="team-name" value={values.name} onChange={(event) => updateValue("name", event.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="team-description">Description</Label><textarea id="team-description" value={values.description} onChange={(event) => updateValue("description", event.target.value)} required rows={4} className="w-full rounded-md border border-input bg-surface px-3 py-2 text-body outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40" /></div>
          <div className="space-y-1.5"><Label htmlFor="team-lead">Team lead</Label><select id="team-lead" value={values.leadMemberId} onChange={(event) => updateValue("leadMemberId", event.target.value)} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control sm:max-w-md"><option value="">Not assigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.roleTitle}</option>)}</select><p className="text-metadata text-muted-foreground">A team lead reference does not automatically change the member&apos;s team membership.</p></div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Link href={teamId ? `/teams/${teamId}` : "/teams"} className={buttonVariants({ variant: "outline" })}>Cancel</Link><Button type="submit" disabled={isSubmitting}>{teamId ? "Save changes" : "Create team"}</Button></div>
        </form>
      </CardContent></Card>
    </div>
  );
}

function TeamProfile({ teamId }: { teamId: string }) {
  const { members, teams, updateMember } = useWorkforceDirectory();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const team = teams.find((candidate) => candidate.id === teamId);
  const [memberIdToAdd, setMemberIdToAdd] = useState("");
  const [membershipNotice, setMembershipNotice] = useState("");
  const [membershipError, setMembershipError] = useState("");

  if (!team) {
    return <EmptyState title="Team not found" description="This team is not part of the current demonstration directory." icon={CircleAlert} action={<Link href="/teams" className={buttonVariants({ variant: "outline" })}><ArrowLeft aria-hidden="true" />Back to teams</Link>} />;
  }
  const activeTeam = team;

  const teamMembers = members.filter((member) => member.teamId === activeTeam.id);
  const teamProjects = getTeamProjects(activeTeam, projects);
  const projectIds = new Set(teamProjects.map((project) => project.id));
  const teamTasks = tasks.filter((task) => projectIds.has(task.projectId));
  const lead = members.find((member) => member.id === activeTeam.leadMemberId);
  const assignableMembers = members.filter((member) => member.teamId !== activeTeam.id);

  function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const member = members.find((candidate) => candidate.id === memberIdToAdd);
    if (!member) {
      setMembershipError("Select an existing member.");
      setMembershipNotice("");
      return;
    }
    const values: MemberFormValues = {
      name: member.name,
      email: member.email,
      roleTitle: member.roleTitle,
      status: member.status,
      teamId: activeTeam.id,
    };
    if (!updateMember(member.id, values)) {
      setMembershipError("The selected member could not be associated with this team.");
      setMembershipNotice("");
      return;
    }
    setMemberIdToAdd("");
    setMembershipError("");
    setMembershipNotice(`${member.name} is now associated with ${activeTeam.name} in this demo.`);
  }

  return (
    <div className="space-y-6">
      <Link href="/teams" className="inline-flex min-h-8 items-center gap-2 text-control font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" />Back to teams</Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><PageHeader title={activeTeam.name} description={activeTeam.description} /><Link href={`/teams/${activeTeam.id}/edit`} className={buttonVariants({ variant: "outline" })}>Edit team</Link></div>
      <Alert><AlertDescription>Team associations and workload are local demonstration data. Project membership is derived from existing project team labels; no task or project records are duplicated.</AlertDescription></Alert>
      <section aria-label="Team workload summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TeamSummaryCard title="Members" value={teamMembers.length} description="Members assigned to this team" />
        <TeamSummaryCard title="Active projects" value={teamProjects.filter((project) => project.status === "active").length} description="Existing projects with a matching team label" />
        <TeamSummaryCard title="Total projects" value={teamProjects.length} description="Project relationships derived from labels" />
        <TeamSummaryCard title="Task workload" value={teamTasks.length} description="Existing tasks in associated projects" />
      </section>
      <Card><CardHeader><div><h2 className="text-card-title font-semibold">Team lead</h2><p className="text-metadata text-muted-foreground">Lead reference is separate from membership.</p></div></CardHeader><CardContent>{lead ? <div className="flex flex-wrap items-center gap-3"><Link href={`/members/${lead.id}`} className="font-medium text-primary hover:underline">{lead.name}</Link><span className="text-body text-muted-foreground">{lead.roleTitle}</span><MemberStatus status={lead.status} /></div> : <p className="text-body text-muted-foreground">No team lead is assigned.</p>}</CardContent></Card>

      <Card>
        <CardHeader><div><h2 className="text-card-title font-semibold">Team members</h2><p className="text-metadata text-muted-foreground">Existing member records associated by stable ID.</p></div></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddMember} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5"><Label htmlFor="team-add-member">Associate an existing member</Label><select id="team-add-member" value={memberIdToAdd} onChange={(event) => { setMemberIdToAdd(event.target.value); setMembershipError(""); setMembershipNotice(""); }} className="h-9 w-full rounded-md border border-input bg-surface px-3 text-control"><option value="">Select a member</option>{assignableMembers.map((member) => <option key={member.id} value={member.id}>{member.name}{member.team ? ` · currently ${member.team}` : " · no team"}</option>)}</select></div>
            <Button type="submit" disabled={!memberIdToAdd}><Plus aria-hidden="true" />Add to team</Button>
          </form>
          {membershipError && <Alert variant="destructive"><AlertDescription>{membershipError}</AlertDescription></Alert>}
          {membershipNotice && <Alert><AlertDescription>{membershipNotice}</AlertDescription></Alert>}
          {teamMembers.length ? <div className="overflow-x-auto rounded-md border border-border"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role / title</TableHead><TableHead>Status</TableHead><TableHead>Assigned tasks</TableHead></TableRow></TableHeader><TableBody>{teamMembers.map((member) => <TableRow key={member.id}><TableCell><Link href={`/members/${member.id}`} className="font-medium text-primary hover:underline">{member.name}</Link><p className="text-metadata text-muted-foreground">{member.email}</p></TableCell><TableCell>{member.roleTitle}</TableCell><TableCell><MemberStatus status={member.status} /></TableCell><TableCell className="tabular-nums">{tasks.filter((task) => task.assignment.primaryAssignee?.type === "human" && task.assignment.primaryAssignee.memberId === member.id || task.assignment.collaborators.some((assignee) => assignee.type === "human" && assignee.memberId === member.id)).length}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No members assigned" description="Associate an existing member using the selector above." icon={UsersRound} />}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card className="min-w-0"><CardHeader><div><h2 className="text-card-title font-semibold">Associated projects</h2><p className="text-metadata text-muted-foreground">Existing projects linked by their team label.</p></div></CardHeader><CardContent>{teamProjects.length ? <div className="space-y-2">{teamProjects.map((project) => <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div className="min-w-0"><Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">{project.name}</Link><p className="text-metadata text-muted-foreground">{project.id}</p></div><ProjectStatusBadge status={project.status} /></div>)}</div> : <EmptyState title="No associated projects" description="No existing project uses this team's project label." icon={UsersRound} />}</CardContent></Card>
        <Card className="min-w-0"><CardHeader><div><h2 className="text-card-title font-semibold">Tasks in team projects</h2><p className="text-metadata text-muted-foreground">Existing task records related through project IDs.</p></div></CardHeader><CardContent>{teamTasks.length ? <div className="space-y-2">{teamTasks.map((task) => <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div className="min-w-0"><Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">{task.title}</Link><p className="text-metadata text-muted-foreground">{task.id} · {projects.find((project) => project.id === task.projectId)?.name ?? "Project unavailable"}</p></div><TaskStatusBadge status={task.status} /></div>)}</div> : <EmptyState title="No tasks in associated projects" description="Tasks will appear here when an existing task references a team project." icon={UsersRound} />}</CardContent></Card>
      </div>
    </div>
  );
}

export { TeamFormPage, TeamProfile, TeamsRegistry };
