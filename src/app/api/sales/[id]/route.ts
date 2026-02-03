// app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateSale, getSaleById } from "@/db/service/sale-entry";
import { SaleInput } from "@/db/service/sale-entry";

// Type for route params in App Router
type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await the params to get the actual value
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body: Partial<SaleInput> = await request.json();

    // Validate that we have at least some data to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No data provided for update" },
        { status: 400 },
      );
    }

    const sale = await updateSale(parsedId, body);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update sale",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const sale = await getSaleById(parsedId);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  }
}
