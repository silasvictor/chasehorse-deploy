"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { PackageCheck } from "lucide-react";

const columns = [
  { key: "item", label: "Item" },
  { key: "result", label: "Result" },
  { key: "severity", label: "Severity" },
  { key: "inspectorName", label: "Inspector" },
];

export default function QualityPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQualityRecords();
  }, []);

  async function loadQualityRecords() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inspections");
      if (!res.ok) throw new Error("Failed to load quality records");
      const inspections = await res.json();
      const records = Array.isArray(inspections)
        ? inspections.flatMap((i: any) =>
            (i.qualityRecords || []).map((r: any) => ({
              ...r,
              item: r.item || "-",
              result: r.result || "pass",
              severity: r.severity || "low",
              inspectorName: i.inspector?.name || "Unknown",
            }))
          )
        : [];
      setRows(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quality records");
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
              <CardTitle className="text-2xl font-bold">Quality records</CardTitle>
              <CardDescription>Quality inspection results and testing data.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No quality records found." />
      )}
    </div>
  );
}
