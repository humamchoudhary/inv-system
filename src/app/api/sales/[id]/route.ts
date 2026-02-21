// src/app/api/sales/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sales, salesSheet, business } from "@/db/schema";
import { auth } from "@/auth";

// ── ownership guard ────────────────────────────────────────────────────────────
// Walks sales → salesSheet → business to confirm the sale belongs to the
// authenticated user. Returns the sale row if owned, null otherwise.

async function getOwnedSale(saleId: string, userId: string) {
  // 1. fetch the sale
  const sale = await db.query.sales.findFirst({
    where: eq(sales.id, saleId),
  });
  if (!sale) return null;

  // 2. fetch the sheet it belongs to
  const sheet = await db.query.salesSheet.findFirst({
    where: eq(salesSheet.id, sale.sheet_id),
  });
  if (!sheet) return null;

  // 3. fetch the business and check ownership
  const biz = await db.query.business.findFirst({
    where: eq(business.id, sheet.business_id),
  });
  if (!biz || biz.user_id !== userId) return null;

  return sale;
}

// ── PUT /api/sales/[id] ────────────────────────────────────────────────────────
// Body: { name?: string; price?: number }
// Updates the sale name and/or price.

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    console.log(body);
    const { name, price } = body as { name?: string; price?: number };

    if (name === undefined && price === undefined) {
      return NextResponse.json(
        { error: "Provide at least one field to update: name or price." },
        { status: 400 },
      );
    }

    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json(
        { error: "name must be a string." },
        { status: 400 },
      );
    }

    if (
      price !== undefined &&
      (typeof price !== "number" || isNaN(price) || price < 0)
    ) {
      return NextResponse.json(
        { error: "price must be a non-negative number." },
        { status: 400 },
      );
    }

    const existing = await getOwnedSale(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Sale not found." }, { status: 404 });
    }

    // Only include fields that were actually sent
    const updatePayload: { name?: string; price?: string } = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (price !== undefined) updatePayload.price = String(price);

    const [updated] = await db
      .update(sales)
      .set(updatePayload)
      .where(eq(sales.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        price: Number(updated.price),
        createdAt: updated.createdAt,
        sheet_id: updated.sheet_id,
      },
    });
  } catch (err) {
    console.error("[PUT /api/sales/:id]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ── DELETE /api/sales/[id] ─────────────────────────────────────────────────────
// Deletes a single sale row.

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log(id, session.user.id);

    const existing = await getOwnedSale(id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Sale not found." }, { status: 404 });
    }

    await db.delete(sales).where(eq(sales.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/sales/:id]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
