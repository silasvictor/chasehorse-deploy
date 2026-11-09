"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  url?: string;
  data?: any[];
  columns: Column[];
  emptyMessage?: string;
}

const STATUS_KEYS = ["status", "discrepancyStatus", "documentStatus"];

export function DataTable({
  url,
  data: dataProp,
  columns,
  emptyMessage = "No records found.",
}: DataTableProps) {
  const [data, setData] = useState<any[]>(dataProp ?? []);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (dataProp) setData(dataProp);
    if (url) fetchData();
  }, [url, dataProp, fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-3/4"><Skeleton /></div>
        <div className="h-10 w-full"><Skeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-slate-text">{emptyMessage}</div>;
  }

  const isStatusCol = (key: string) =>
    STATUS_KEYS.includes(key) || key.endsWith("Status");

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "-";
    if (
      key.endsWith("At") ||
      key.endsWith("Date") ||
      key === "dueDate" ||
      key === "createdAt" ||
      key === "completedAt" ||
      key === "scheduledAt" ||
      key === "verifiedAt" ||
      key === "resolvedAt"
    ) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id as string | number}>
            {columns.map((col) => {
              const value = row[col.key];
              return (
                <TableCell key={col.key}>
                  {isStatusCol(col.key) ? (
                    <Badge variant="default" className={statusBadgeClass(String(value))}>
                      {String(value).replace(/_/g, " ")}
                    </Badge>
                  ) : (
                    <span className="text-sm text-foreground">{formatValue(col.key, value)}</span>
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function statusBadgeClass(status: string): string {
  const variants: Record<string, string> = {
    OPEN: "border-amber-200 bg-amber-50 text-warning-amber",
    UNDER_REVIEW: "border-blue-200 bg-blue-50 text-blue-600",
    RESOLVED: "border-green-200 bg-green-50 text-success-teal",
    REJECTED: "border-red-200 bg-red-50 text-error-red",
    SCHEDULED: "border-blue-200 bg-blue-50 text-blue-600",
    IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-600",
    COMPLETED: "border-green-200 bg-green-50 text-success-teal",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-text",
    OVERDUE: "border-red-200 bg-red-50 text-error-red",
    open: "border-amber-200 bg-amber-50 text-warning-amber",
    in_progress: "border-blue-200 bg-blue-50 text-blue-600",
    completed: "border-green-200 bg-green-50 text-success-teal",
    overdue: "border-red-200 bg-red-50 text-error-red",
    PENDING: "border-amber-200 bg-amber-50 text-warning-amber",
    PROCESSING: "border-blue-200 bg-blue-50 text-blue-600",
    FLAGGED: "border-orange-200 bg-orange-50 text-orange-700",
    DRAFT: "border-slate-200 bg-slate-100 text-slate-text",
    GENERATED: "border-blue-200 bg-blue-50 text-blue-600",
    PUBLISHED: "border-green-200 bg-green-50 text-success-teal",
    INFO: "border-blue-200 bg-blue-50 text-blue-600",
    WARNING: "border-amber-200 bg-amber-50 text-warning-amber",
    ERROR: "border-red-200 bg-red-50 text-error-red",
    SUCCESS: "border-green-200 bg-green-50 text-success-teal",
    ALERT: "border-red-200 bg-red-50 text-error-red",
  };
  return variants[status] || "border-slate-200 bg-slate-100 text-slate-text";
}

export { statusBadgeClass };
