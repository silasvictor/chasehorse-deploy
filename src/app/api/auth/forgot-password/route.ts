import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { createPasswordResetToken } from "@/lib/password-reset";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting (3 attempts per 30 minutes per IP)
  const rl = checkRateLimit(req, RateLimitPresets.PASSWORD_RESET);
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email" },
        { status: 400, headers: rl.headers }
      );
    }

    const { email } = parsed.data;
    const result = await createPasswordResetToken(email);

    // Development/demo mode convenience: log and include token so operator can test without an active SMTP server
    const isDev = process.env.NODE_ENV !== "production";
    const resetUrl = result.token
      ? `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${result.token}`
      : undefined;

    if (isDev && resetUrl) {
      console.log(`[Auth] Password reset link for ${email}: ${resetUrl}`);
    }

    return NextResponse.json(
      {
        message: "If an account exists for this email, password reset instructions have been generated.",
        ...(isDev && resetUrl ? { devResetUrl: resetUrl, token: result.token } : {}),
      },
      { headers: rl.headers }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500, headers: rl.headers }
    );
  }
}

