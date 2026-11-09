"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User profile</CardTitle>
          <CardDescription>Account details and preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 pb-8">
          <Avatar className="h-24 w-24 mb-2">
            <AvatarFallback>
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-navy-midnight">{user?.name || "Unknown"}</h2>
          <p className="text-sm text-slate-text">{user?.email || "-"}</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-success-teal" />
            <span className="text-success-teal font-medium">Active</span>
          </div>
          <BadgeUser role={user?.role} />
        </CardContent>
      </Card>
    </div>
  );
}

function BadgeUser({ role }: { role?: string }) {
  const labels: Record<string, string> = {
    ADMINISTRATOR: "Administrator",
    OPERATIONS_MANAGER: "Operations Manager",
    FIELD_INSPECTOR: "Field Inspector",
    AUDITOR: "Auditor",
    READ_ONLY_VIEWER: "Read-only Viewer",
  };
  return (
    <span className="px-3 py-1 rounded-full border border-border-grey bg-surface-muted text-xs font-medium text-slate-text">
      {labels[role ?? ""] || role || "Viewer"}
    </span>
  );
}
