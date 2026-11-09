"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Truck, Plus } from "lucide-react";
import Link from "next/link";

const columns = [
  { key: "assignmentId", label: "Assignment" },
  { key: "checklistType", label: "Type" },
  { key: "status", label: "Status" },
  { key: "completedAt", label: "Completed" },
];

export default function ChecklistsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checklists");
      if (!res.ok) throw new Error("Failed to load checklists");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((c: any) => ({
              ...c,
              checklistType: c.checklistType.charAt(0).toUpperCase() + c.checklistType.slice(1),
              completedAt: c.completedAt ? new Date(c.completedAt).toLocaleDateString() : "-",
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklists");
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
              <CardTitle className="text-2xl font-bold">Loading checklists</CardTitle>
              <CardDescription>Loading and unloading supervision checklists.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <Link href="/dashboard/checklists/new">
          <Button><Plus className="mr-2 w-4 h-4" /> New checklist</Button>
        </Link>
      </div>
      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No checklists recorded." />
      )}
    </div>
  );
}
