"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on initial mount
  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenValid(false);
        setTokenError("Missing password reset token in URL.");
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(data.error || "Reset link is invalid or expired.");
        }
      } catch {
        setTokenValid(false);
        setTokenError("Could not verify token. Please check your network connection.");
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [token]);

  // Password requirements calculation
  const rules = useMemo(() => {
    return [
      { id: "len", label: "At least 8 characters", valid: password.length >= 8 },
      { id: "upper", label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
      { id: "lower", label: "One lowercase letter (a-z)", valid: /[a-z]/.test(password) },
      { id: "num", label: "One numeric digit (0-9)", valid: /[0-9]/.test(password) },
      { id: "sym", label: "One special symbol (!@#$%...)", valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];
  }, [password]);

  const allRulesPassed = rules.every((r) => r.valid);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed) {
      setError("Please ensure your password satisfies all security requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="text-center p-8 text-slate-300">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Verifying security token...</p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Invalid or Expired Link</h2>
          <p className="text-sm text-slate-400 mt-1">{tokenError}</p>
        </div>
        <div className="pt-2">
          <Link href="/forgot-password">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white w-full">Request a New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Password Reset Complete</h2>
          <p className="text-sm text-slate-400 mt-1">
            Your password has been updated securely. Redirecting to the sign-in page...
          </p>
        </div>
        <div className="pt-2">
          <Link href="/signin">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white w-full">Sign In Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-200 text-sm font-medium">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Strength Checklist */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
        <p className="text-slate-400 font-medium">Security Requirements:</p>
        <div className="grid grid-cols-1 gap-1">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-1.5 ${r.valid ? "text-emerald-400" : "text-slate-500"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${r.valid ? "bg-emerald-400" : "bg-slate-600"}`} />
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-200 text-sm font-medium">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-400">Passwords do not match.</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading || !allRulesPassed || !passwordsMatch}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
      >
        {loading ? "Updating Password..." : "Update Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 text-lg">
            CH
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ChaseHorse Deploy</span>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur shadow-2xl text-slate-100">
          <CardHeader className="space-y-1 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Create New Password</CardTitle>
            <CardDescription className="text-slate-400">
              Please enter your new high-strength password below.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Suspense fallback={<div className="text-center p-4 text-slate-400">Loading reset form...</div>}>
              <ResetPasswordForm />
            </Suspense>
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

