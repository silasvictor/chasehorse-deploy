import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { auditLog } from "./audit";

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates password strength according to enterprise security standards.
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one numeric digit
 * - At least one special symbol
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a secure, time-limited single-use password reset token.
 * Valid for 60 minutes.
 */
export async function createPasswordResetToken(email: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Always return success in external interface to prevent user enumeration attacks.
  if (!user || !user.isActive) {
    return { success: true };
  }

  // Invalidate any previously issued unused tokens for this email
  try {
    const existingTokens = await db.passwordResetToken.findMany({
      where: { email: normalizedEmail, used: false },
    });
    for (const t of existingTokens) {
      await db.passwordResetToken.update({
        where: { id: t.id },
        data: { used: true },
      });
    }
  } catch {
    // Non-fatal if table update throws
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: {
      token,
      email: normalizedEmail,
      expiresAt,
      used: false,
    },
  });

  // Log security audit event
  await auditLog(
    { userId: user.id, role: user.role as any, isActive: user.isActive },
    "PASSWORD_RESET_REQUESTED",
    "User",
    user.id,
    { email: normalizedEmail, expiresAt: expiresAt.toISOString() }
  );

  return { success: true, token };
}

/**
 * Verifies if a reset token is valid and unexpired.
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid token" };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { valid: false, error: "Reset token not found or already used." };
  }

  if (record.used) {
    return { valid: false, error: "This reset link has already been used. Please request a new one." };
  }

  const expiresTime = new Date(record.expiresAt).getTime();
  if (expiresTime < Date.now()) {
    return { valid: false, error: "This reset link has expired. Please request a new one." };
  }

  return { valid: true, email: record.email };
}

/**
 * Resets user password using a verified reset token.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const verification = await verifyResetToken(token);
  if (!verification.valid || !verification.email) {
    return { success: false, error: verification.error || "Invalid token" };
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, error: strength.errors.join(" ") };
  }

  const user = await db.user.findUnique({
    where: { email: verification.email },
  });

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in database
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, updatedAt: new Date() },
  });

  // Mark token as used
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (record) {
    await db.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });
  }

  // Audit log password reset completion
  await auditLog(
    { userId: user.id, role: user.role as any, isActive: user.isActive },
    "PASSWORD_RESET_COMPLETED",
    "User",
    user.id,
    { email: verification.email }
  );

  return { success: true };
}

