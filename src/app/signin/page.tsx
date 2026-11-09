"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function performSignIn(signInEmail: string, signInPass: string) {
    setLoading(true);
    setMessage(null);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPass,
        redirect: false,
      });

      if (result?.error) {
        setMessage(result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage("Sign in failed. Please check your credentials.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }
    await performSignIn(email, password);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-border-grey shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 shadow-sm">
            CH
          </div>
          <h2 className="text-2xl font-bold text-navy-midnight">Sign in to Operations</h2>
          <p className="text-slate-500 text-sm mt-1">
            Access ChaseHorse logistics verification platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-600 border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
