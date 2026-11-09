import { NextRequest, NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/password-reset";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token parameter." }, { status: 400 });
  }

  const result = await verifyResetToken(token);
  return NextResponse.json(result);
}

