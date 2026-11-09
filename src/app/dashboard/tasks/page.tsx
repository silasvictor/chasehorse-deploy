"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";

const columns = [
  { key: "title", label: "Task" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assigneeName", label: "Assignee" },
  { key: "dueDate", label: "Due" },
];

export default function TasksPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((t: any) => ({
              ...t,
              assigneeName: t.assignee?.name || "Unassigned",
              dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-",
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Tasks</CardTitle>
              <CardDescription>Task status tracking for operations work.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <Link href="/dashboard/tasks/new">
          <Button><Plus className="mr-2 w-4 h-4" /> New task</Button>
        </Link>
      </div>
      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No tasks recorded." />
      )}
    </div>
  );
}
