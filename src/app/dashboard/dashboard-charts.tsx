"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AssignmentTrendPoint {
  month: string;
  assignments: number;
}

interface AssignmentStatusPoint {
  name: string;
  value: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#94a3b8",
  ASSIGNED: "#2563eb",
  IN_PROGRESS: "#0891b2",
  COMPLETED: "#059669",
  CANCELLED: "#cbd5e1",
  OVERDUE: "#e11d48",
};

const numberFormatter = new Intl.NumberFormat("en");

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[245px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
      <p className="text-sm font-medium text-slate-700">Not enough activity to chart</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">{message}</p>
    </div>
  );
}

export function DashboardCharts({
  assignmentTrend,
  assignmentStatuses,
}: {
  assignmentTrend: AssignmentTrendPoint[];
  assignmentStatuses: AssignmentStatusPoint[];
}) {
  const [period, setPeriod] = useState<6 | 12>(6);
  const trend = useMemo(() => assignmentTrend.slice(-period), [assignmentTrend, period]);
  const totalStatusCount = assignmentStatuses.reduce((total, item) => total + item.value, 0);

  return (
    <div className="grid min-w-0 gap-4">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Assignment activity</h2>
            <p className="mt-1 text-xs text-slate-500">Assignments created by month</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" aria-label="Chart time period">
            {([6, 12] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${period === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {value} months
              </button>
            ))}
          </div>
        </div>
        {trend.some((point) => point.assignments > 0) ? (
          <div className="h-[245px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="assignmentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value: number) => numberFormatter.format(value)}
                />
                <Tooltip
                  cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
                  contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}
                  formatter={(value) => [numberFormatter.format(Number(value)), "Assignments"]}
                  labelStyle={{ color: "#334155", fontWeight: 600, marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="assignments"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#assignmentFill)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmptyState message="Assignment activity will appear here as records are created." />
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Assignment status</h2>
            <p className="mt-1 text-xs text-slate-500">Current distribution across all records</p>
          </div>
          <Link href="/dashboard/assignments" className="text-xs font-medium text-blue-700 hover:text-blue-800">
            View all
          </Link>
        </div>
        {totalStatusCount > 0 ? (
          <div className="grid items-center gap-3 sm:grid-cols-[minmax(150px,0.8fr)_minmax(0,1.2fr)]">
            <div className="relative mx-auto h-[190px] w-full max-w-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assignmentStatuses}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {assignmentStatuses.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", fontSize: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}
                    formatter={(value) => [numberFormatter.format(Number(value)), "Assignments"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">{numberFormatter.format(totalStatusCount)}</span>
                <span className="text-[11px] text-slate-500">assignments</span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {assignmentStatuses.map((item) => (
                <li key={item.status} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: STATUS_COLORS[item.status] || "#64748b" }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-slate-800">{numberFormatter.format(item.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ChartEmptyState message="Status distribution will appear here when the first assignment is recorded." />
        )}
      </section>
    </div>
  );
}
