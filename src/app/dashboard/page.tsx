export const instant = false;

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowUpRight,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Package,
  Plus,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

type AssignmentStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "OVERDUE";

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function formatDueDate(value: string | Date | null | undefined): string {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as {
    id?: string;
    name?: string | null;
    role?: string;
  } | undefined;
  const isFieldWorker = user?.role === "FIELD_INSPECTOR" && Boolean(user.id);
  const canViewDocuments = ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"].includes(user?.role || "");
  const canViewDiscrepancies = ["ADMINISTRATOR", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "AUDITOR"].includes(user?.role || "");
  const now = new Date();
  const assignmentScope = isFieldWorker ? { assigneeId: user?.id } : {};
  const inspectionScope = isFieldWorker ? { inspectorId: user?.id } : {};
  const taskScope = isFieldWorker ? { assigneeId: user?.id } : {};
  const monthLabels = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return {
      date,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
    };
  });

  const [
    totalAssignments,
    activeAssignments,
    completedAssignments,
    overdueAssignments,
    openInspections,
    pendingDocuments,
    openDiscrepancies,
    openTasks,
    assignmentStatusCounts,
    monthlyAssignmentCounts,
    recentAssignments,
  ] = await Promise.all([
    db.assignment.count({ where: assignmentScope }),
    db.assignment.count({ where: { ...assignmentScope, status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
    db.assignment.count({ where: { ...assignmentScope, status: "COMPLETED" } }),
    db.assignment.count({ where: { ...assignmentScope, status: "OVERDUE" } }),
    db.inspection.count({ where: { ...inspectionScope, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } }),
    canViewDocuments
      ? db.document.count({ where: { ...(isFieldWorker ? { uploadedById: user?.id } : {}), status: "PENDING" } })
      : Promise.resolve(0),
    canViewDiscrepancies
      ? db.stockDiscrepancy.count({
          where: {
            ...(isFieldWorker ? { reportedById: user?.id } : {}),
            status: { in: ["OPEN", "UNDER_REVIEW"] },
          },
        })
      : Promise.resolve(0),
    db.task.count({ where: { ...taskScope, status: { in: ["open", "in_progress", "overdue"] } } }),
    Promise.all(
      (["DRAFT", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE"] as AssignmentStatus[]).map(
        async (status) => ({
          status,
          count: await db.assignment.count({ where: { ...assignmentScope, status } }),
        }),
      ),
    ),
    Promise.all(
      monthLabels.map(async ({ date }) => ({
        month: date.toISOString().slice(0, 7),
        count: await db.assignment.count({
          where: {
            ...assignmentScope,
            createdAt: {
              gte: monthStart(date),
              lt: monthEnd(date),
            },
          },
        }),
      })),
    ),
    db.assignment.findMany({
      where: assignmentScope,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { assignee: true },
    }).then((records) => records.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      status: assignment.status,
      location: assignment.location,
      dueDate: assignment.dueDate,
      assigneeName: assignment.assignee?.name ?? null,
    }))),
  ]);

  const chartData = monthLabels.map(({ label }, index) => ({
    month: label,
    assignments: monthlyAssignmentCounts[index]?.count ?? 0,
  }));
  const statusLabels: Record<AssignmentStatus, string> = {
    DRAFT: "Draft",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    OVERDUE: "Overdue",
  };
  const statusData = assignmentStatusCounts
    .filter((item) => item.count > 0)
    .map((item) => ({ name: statusLabels[item.status], value: item.count, status: item.status }));
  const completionRate = totalAssignments
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;

  const metrics = [
    {
      label: "Total assignments",
      value: totalAssignments,
      detail: `${activeAssignments} currently active`,
      icon: ClipboardCheck,
      href: "/dashboard/assignments",
      tone: "blue",
    },
    {
      label: "Completed",
      value: completedAssignments,
      detail: `${completionRate}% of all assignments`,
      icon: CheckCircle2,
      href: "/dashboard/assignments?status=COMPLETED",
      tone: "green",
    },
    {
      label: "Overdue work",
      value: overdueAssignments,
      detail: "Needs operational attention",
      icon: AlertTriangle,
      href: "/dashboard/assignments?status=OVERDUE",
      tone: "amber",
    },
    {
      label: "Open inspections",
      value: openInspections,
      detail: "Scheduled or in progress",
      icon: ShieldAlert,
      href: "/dashboard/inspections",
      tone: "violet",
    },
    {
      label: "Pending documents",
      value: pendingDocuments,
      detail: "Awaiting review",
      icon: FileText,
      href: "/dashboard/documents",
      tone: "slate",
    },
    {
      label: "Open discrepancies",
      value: openDiscrepancies,
      detail: "Open or under review",
      icon: Package,
      href: "/dashboard/discrepancies",
      tone: "rose",
    },
  ].filter((metric) => {
    if (metric.label === "Pending documents") return canViewDocuments;
    if (metric.label === "Open discrepancies") return canViewDiscrepancies;
    return true;
  });

  const quickLinks = [
    { label: "Assignments", description: `${activeAssignments} active`, href: "/dashboard/assignments", icon: Truck },
    { label: "Documents", description: `${pendingDocuments} pending review`, href: "/dashboard/documents", icon: FileText },
    { label: "Tasks", description: `${openTasks} open`, href: "/dashboard/tasks", icon: CalendarDays },
  ].filter((item) => item.label !== "Documents" || canViewDocuments);

  return (
    <div className="space-y-7 pb-10">
      <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Operations workspace
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Good day{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            A current view of assignments, inspections and operational follow-ups.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/reports"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 text-slate-500" />
            Reports
          </Link>
          <Link
            href="/dashboard/assignments"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New assignment
          </Link>
        </div>
      </section>

      <section aria-label="Operational key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {metric.value.toLocaleString()}
                </p>
              </div>
              <span className={`rounded-lg p-2.5 ${metric.tone === "blue" ? "bg-blue-50 text-blue-700" : metric.tone === "green" ? "bg-emerald-50 text-emerald-700" : metric.tone === "amber" ? "bg-amber-50 text-amber-700" : metric.tone === "violet" ? "bg-violet-50 text-violet-700" : metric.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                <metric.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-2 flex items-center justify-between text-xs text-slate-500">
              {metric.detail}
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </p>
          </Link>
        ))}
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0">
          <DashboardCharts assignmentTrend={chartData} assignmentStatuses={statusData} />
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent assignments</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest operational activity</p>
            </div>
            <Link href="/dashboard/assignments" aria-label="View all assignments" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentAssignments.length ? (
            <ul className="divide-y divide-slate-100">
              {recentAssignments.map((assignment) => (
                <li key={assignment.id}>
                  <Link href="/dashboard/assignments" className="block px-5 py-4 transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{assignment.title}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {assignment.assigneeName || "Unassigned"} · {assignment.location || "Location not set"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${assignment.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : assignment.status === "OVERDUE" ? "bg-rose-50 text-rose-700" : assignment.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                        {String(assignment.status).replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock3 className="h-3 w-3" />
                      Due {formatDueDate(assignment.dueDate)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-700">No assignments yet</p>
              <p className="mt-1 text-xs text-slate-500">New work will appear here when it is created.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Quick access</h2>
            <p className="mt-0.5 text-xs text-slate-500">Jump back into your daily workflows</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLinks.map((item) => (
            <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
              <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </Link>
          ))}
        </div>
      </section>

      {(pendingDocuments > 0 || openTasks > 0 || openDiscrepancies > 0) && (
        <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-amber-100 p-1.5 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-950">Follow-ups need attention</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                {[
                  pendingDocuments > 0 ? `${pendingDocuments} document${pendingDocuments === 1 ? "" : "s"} pending` : null,
                  openTasks > 0 ? `${openTasks} open task${openTasks === 1 ? "" : "s"}` : null,
                  openDiscrepancies > 0 ? `${openDiscrepancies} discrepancy${openDiscrepancies === 1 ? "" : "ies"}` : null,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <Link href="/dashboard/notifications" className="inline-flex items-center gap-1 self-start text-xs font-semibold text-amber-900 hover:underline sm:self-auto">
            Review follow-ups <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}
