// src/app/api/user/update/route.ts
// PUT — update the authenticated user's display name.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  await db.update(users).set({ name }).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true, name });
}
