"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Mail, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    // Client-side validation
    if (!name || !email || !password) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Registration failed.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage("Account created successfully! Signing in...");
      setMessageType("success");

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setMessage("Account created. Please sign in manually.");
        setMessageType("success");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-border-grey shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-navy-midnight">Create your Account</h2>
          <p className="text-slate-500 text-sm mt-1">
            Join the ChaseHorse operations &amp; verification platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div
              className={`rounded-lg p-3.5 text-sm flex items-start gap-2 ${
                messageType === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              )}
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="name"
                name="name"
                placeholder="Jane Doe"
                required
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Work email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
              <span className="text-xs text-slate-400">Min. 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-600 hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
