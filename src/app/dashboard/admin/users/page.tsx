"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog } from "lucide-react";

const ROLES = [
  "ADMINISTRATOR",
  "OPERATIONS_MANAGER",
  "FIELD_INSPECTOR",
  "AUDITOR",
  "READ_ONLY_VIEWER",
] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Failed to load users");
          setUsers([]);
        } else {
          setUsers(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Network error");
        setLoading(false);
      });
  }, []);

  async function updateUser(id: string, field: string, value: any) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, [field]: value }),
    });
    if (!res.ok) alert("Failed to update user");
  }

  if (loading) return <div className="p-4 text-slate-text">Loading users…</div>;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="flex items-center gap-2">
          <UserCog size={20} />
          <CardTitle className="text-2xl font-bold">User &amp; role management</CardTitle>
        </CardHeader>
        <CardDescription>
          Administrators can manage user roles and account status. Role changes
          are enforced server-side.
        </CardDescription>
      </Card>

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-grey text-slate-text">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border-grey hover:bg-surface-muted">
                <td className="p-3 text-navy-midnight font-medium">{u.name || "-"}</td>
                <td className="p-3 text-slate-text">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, "role", e.target.value)}
                    className="border border-border-grey rounded-md bg-white px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <select
                    value={String(u.isActive)}
                    onChange={(e) => updateUser(u.id, "isActive", e.target.value === "true")}
                    className="border border-border-grey rounded-md bg-white px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <option value="true">Active</option>
                    <option value="false">Deactivated</option>
                  </select>
                </td>
                <td className="p-3 text-xs text-slate-text">{u.createdAt?.slice(0, 10) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-lg border border-border-grey bg-bg-cloud text-sm">
        <p className="font-semibold text-navy-midnight mb-2">Role descriptions</p>
        <ul className="list-disc list-inside text-slate-text space-y-1">
          <li><strong>Administrator:</strong> Full access including user management and AI settings.</li>
          <li><strong>Operations Manager:</strong> Manage assignments, inspections, inventory, reports.</li>
          <li><strong>Field Inspector:</strong> Execute inspections, checklists, tasks on assigned records.</li>
          <li><strong>Auditor:</strong> Read-only access to inspections, quality, POD, discrepancies.</li>
          <li><strong>Read-only Viewer:</strong> Read-only access to operational data.</li>
        </ul>
      </div>
    </div>
  );
}
