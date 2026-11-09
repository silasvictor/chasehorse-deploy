"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Plus } from "lucide-react";
import Link from "next/link";

const columns = [
  { key: "title", label: "Inspection" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "warehouseName", label: "Warehouse" },
  { key: "inspectorName", label: "Inspector" },
];

export default function InspectionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inspections");
      if (!res.ok) throw new Error("Failed to load inspections");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((i: any) => ({
              ...i,
              type: i.type.replace(/_/g, " "),
              warehouseName: i.warehouse?.name || "-",
              inspectorName: i.inspector?.name || "Unassigned",
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inspections");
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
              <CardTitle className="text-2xl font-bold">Inspections</CardTitle>
              <CardDescription>Schedule and record warehouse and field inspections.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <Link href="/dashboard/inspections/new">
          <Button><Plus className="mr-2 w-4 h-4" /> New inspection</Button>
        </Link>
      </div>
      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No inspections recorded." />
      )}
    </div>
  );
}
