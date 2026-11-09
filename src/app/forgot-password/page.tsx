"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, AlertCircle, ExternalLink } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setSubmitted(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 text-lg">
            CH
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ChaseHorse Deploy</span>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur shadow-2xl text-slate-100">
          <CardHeader className="space-y-1 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Reset Password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your corporate email address and we'll generate a secure, time-limited reset link.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-800/60 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-200">Reset instructions generated</p>
                    <p className="text-emerald-300/80 mt-1">
                      If an account exists for <strong className="text-emerald-100">{email}</strong>, password reset
                      instructions have been issued. The reset link is valid for 60 minutes.
                    </p>
                  </div>
                </div>

                {devResetUrl && (
                  <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs space-y-2">
                    <div className="flex items-center justify-between text-blue-300 font-medium">
                      <span>Development Mode Active</span>
                      <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-200">Local Testing</span>
                    </div>
                    <p className="text-slate-300">Click below to proceed directly to the password reset form:</p>
                    <Link
                      href={devResetUrl}
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold break-all underline"
                    >
                      <span>Open Reset Link</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 text-sm font-medium">
                    Corporate Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="inspector@chasehorse.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 shadow-lg shadow-blue-600/30"
                >
                  {loading ? "Generating Link..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-800/80 pt-4 gap-2 text-center">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

