import { NextResponse } from "next/server";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });

  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Client JavaScript can access to send in x-csrf-token header
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 4 * 60 * 60, // 4 hours
  });

  return res;
}

