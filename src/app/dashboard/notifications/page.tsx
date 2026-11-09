"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/dashboard/data-table";
import { Bell } from "lucide-react";

const columns = [
  { key: "title", label: "Title" },
  { key: "content", label: "Content" },
  { key: "read", label: "Read" },
  { key: "createdAt", label: "Time" },
];

export default function NotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setRows(
        Array.isArray(data)
          ? data.map((n: any) => ({
              ...n,
              content: String(n.content ?? "").slice(0, 100),
              read: n.read ? "Yes" : "No",
              createdAt: n.createdAt ? new Date(n.createdAt).toLocaleString() : "-",
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="flex items-center gap-2">
          <Bell size={20} />
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
        </CardHeader>
        <CardDescription>System alerts and task notifications.</CardDescription>
        {error && (
          <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
            {error}
          </div>
        )}
      </Card>
      {loading ? (
        <div className="h-10 w-3/4"><div className="h-full w-full bg-surface-muted rounded animate-pulse" /></div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No notifications." />
      )}
    </div>
  );
}
