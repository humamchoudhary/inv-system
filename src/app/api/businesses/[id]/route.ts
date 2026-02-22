// src/app/api/business/[id]/route.ts
// PUT — update business name and/or currency
// Verifies the business belongs to the authenticated user before updating.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { business } from "@/db/schema";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/businesses/[id]">,
  // { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  let body: { name?: string; currency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { name, currency } = body;

  if (!name?.trim() && !currency) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  // Verify this business belongs to the authenticated user
  const u_business = await db.query.business.findFirst({
    where: and(eq(business.id, id), eq(business.user_id, session.user.id)),
  });

  if (!u_business) {
    return NextResponse.json(
      { message: "Business not found" },
      { status: 404 },
    );
  }

  // Build update payload — only include provided fields
  const updates: { name?: string; currency?: string } = {};
  if (name?.trim()) updates.name = name.trim();
  if (currency) updates.currency = currency;

  await db.update(business).set(updates).where(eq(business.id, id));

  return NextResponse.json({ success: true, ...updates });
}
