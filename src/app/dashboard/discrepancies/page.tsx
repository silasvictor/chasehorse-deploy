"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

const columns = [
  { key: "inventoryItemName", label: "Item" },
  { key: "recordedQty", label: "Recorded" },
  { key: "countedQty", label: "Counted" },
  { key: "difference", label: "Difference" },
  { key: "status", label: "Status" },
  { key: "reporterName", label: "Reported by" },
];

export default function DiscrepanciesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDiscrepancies();
  }, []);

  async function loadDiscrepancies() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discrepancies");
      if (!res.ok) throw new Error("Failed to load discrepancies");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((d: any) => ({
              ...d,
              inventoryItemName: d.inventoryItem?.name || "-",
              reporterName: d.reporter?.name || "-",
              difference: d.countedQty - d.recordedQty,
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discrepancies");
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
              <CardTitle className="text-2xl font-bold">Stock discrepancies</CardTitle>
              <CardDescription>Track and resolve inventory count differences.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <Link href="/dashboard/discrepancies/new">
          <Button><AlertTriangle className="mr-2 w-4 h-4" /> Record discrepancy</Button>
        </Link>
      </div>
      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No discrepancies recorded." />
      )}
    </div>
  );
}
