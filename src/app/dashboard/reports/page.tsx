"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";

const reportTypes = [
  "WAREHOUSE_INSPECTION_SUMMARY",
  "INVENTORY_DISCREPANCY",
  "POD_COMPLIANCE",
  "QUALITY_INSPECTION",
  "OUTSTANDING_TASKS",
];

const columns = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
];

export default function ReportsPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState(reportTypes[0]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((r: any) => ({
              ...r,
              type: r.type.replace(/_/g, " "),
              createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-",
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  const generate = async () => {
    if (!title.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setTitle("");
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Reports</CardTitle>
              <CardDescription>Generate and manage operational reports.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Report title"
            className="w-full sm:w-64"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-border-grey rounded-md bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {reportTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button onClick={generate} disabled={generating || !title.trim()}>
            <BarChart3 className="mr-2 w-4 h-4" /> {generating ? "Generating..." : "Generate draft"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft reports</CardTitle>
          <CardDescription>Reports are drafts until reviewed and published.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-10 w-3/4"><div className="h-full w-full bg-surface-muted rounded animate-pulse" /></div>
          ) : (
            <DataTable data={rows} columns={columns} emptyMessage="No reports generated yet." />
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg border border-border-grey bg-bg-cloud text-sm">
        <p className="font-semibold text-navy-midnight mb-2">How AI reports work</p>
        <ul className="list-disc list-inside text-slate-text space-y-1">
          <li>Reports are generated from actual authorized records.</li>
          <li>AI output is a draft — review and edit before publishing.</li>
          <li>Uncertain predictions are not presented as confirmed facts.</li>
        </ul>
      </div>
    </div>
  );
}
