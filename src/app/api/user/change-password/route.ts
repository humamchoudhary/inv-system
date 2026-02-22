// src/app/api/user/change-password/route.ts
// POST — verifies the user's current password then updates to the new one.
// Uses bcrypt (same library as the rest of the auth stack).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  // ── Validate inputs ──
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "currentPassword and newPassword are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  // ── Fetch user with password hash ──
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user || !user.password) {
    // If the account was created via OAuth it has no password
    return NextResponse.json(
      {
        message:
          "No password set on this account. Sign in with your OAuth provider.",
      },
      { status: 400 },
    );
  }

  // ── Verify current password ──
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 401 },
    );
  }

  // ── Hash and save new password ──
  const hashed = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ password: hashed })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
