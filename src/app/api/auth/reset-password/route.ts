import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/lib/password-reset";
import { z } from "zod";

const ResetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const rl = checkRateLimit(req, RateLimitPresets.AUTH);
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400, headers: rl.headers }
      );
    }

    const { token, password } = parsed.data;
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password." },
        { status: 400, headers: rl.headers }
      );
    }

    return NextResponse.json(
      { message: "Password has been reset successfully. You can now sign in with your new credentials." },
      { headers: rl.headers }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500, headers: rl.headers }
    );
  }
}

