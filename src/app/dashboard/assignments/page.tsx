"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AssignmentRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | Date | null;
  assignee?: { name?: string | null } | null;
}

interface AssignmentRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string;
  dueDate: string;
}

const STATUS_FILTER_EVENT = "ch:assignment-status-change";

function subscribeToStatusFilter(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(STATUS_FILTER_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(STATUS_FILTER_EVENT, onChange);
  };
}

function getStatusFilterSnapshot() {
  return new URLSearchParams(window.location.search).get("status") || "";
}

function getServerStatusFilterSnapshot() {
  return "";
}

function isAssignmentRecord(value: unknown): value is AssignmentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.status === "string" &&
    typeof record.priority === "string"
  );
}

const columns = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assigneeName", label: "Assignee" },
  { key: "dueDate", label: "Due Date" },
];

export default function AssignmentsPage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState("medium");
  const statusFilter = useSyncExternalStore(
    subscribeToStatusFilter,
    getStatusFilterSnapshot,
    getServerStatusFilterSnapshot,
  );
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadAssignments = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/assignments${query}`);
      if (!res.ok) throw new Error("Failed to load assignments");
      const data: unknown = await res.json();
      if (!Array.isArray(data) || !data.every(isAssignmentRecord)) {
        throw new Error("The assignments response was invalid.");
      }
      setRows(data.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        status: assignment.status,
        priority: assignment.priority,
        assigneeName: assignment.assignee?.name || "Unassigned",
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "-",
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadAssignments(statusFilter));
  }, [loadAssignments, statusFilter]);

  function updateStatusFilter(status: string) {
    const url = new URL(window.location.href);
    if (status) url.searchParams.set("status", status);
    else url.searchParams.delete("status");
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(STATUS_FILTER_EVENT));
  }

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, priority }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create assignment");
      }
      setOpen(false);
      setTitle("");
      setDesc("");
      await loadAssignments(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Assignments</CardTitle>
              <CardDescription>Manage field assignments and track progress.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-1/2 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Assignments</CardTitle>
              <CardDescription>Manage field assignments and track progress.</CardDescription>
            </CardHeader>
          </Card>
          {error && (
            <div className="mt-2 p-3 rounded-lg border border-error-red bg-red-50 text-error-red text-sm">
              {error}
            </div>
          )}
        </div>
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 w-4 h-4" /> New assignment
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="assignment-status-filter" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filter by status
          </label>
          <select
            id="assignment-status-filter"
            value={statusFilter}
            onChange={(event) => {
              const status = event.target.value;
              updateStatusFilter(status);
            }}
            className="mt-1.5 block h-10 w-full min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <p className="text-xs text-slate-500">
          {statusFilter ? `Showing ${statusFilter.replaceAll("_", " ").toLowerCase()} assignments` : "Showing all assignments"}
        </p>
      </div>

      {error && !loading ? (
        <div className="p-8 text-center text-slate-text">
          <p>{error}</p>
          <Button variant="outline" onClick={() => loadAssignments(statusFilter)}>Retry</Button>
        </div>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No assignments yet. Create one to get started." />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New assignment</DialogTitle>
            <DialogDescription>Create a new field assignment.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            void create();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
          </form>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void create()} disabled={creating || !title}>
              {creating ? "Creating..." : "Create assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
