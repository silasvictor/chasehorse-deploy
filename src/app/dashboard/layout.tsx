"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar, Topbar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/ui/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading ChaseHorse Operations...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Topbar />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
