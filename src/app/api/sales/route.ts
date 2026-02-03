// app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listSales, createSale } from "@/db/service/sale-entry";
import { SaleInput } from "@/db/service/sale-entry";

export async function GET() {
  try {
    const sales = await listSales();
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Convert string date to Date object if provided
    const saleData: SaleInput = {
      product_name: body.product_name,
      unit_price: body.unit_price ? Number(body.unit_price) : undefined,
      quantity: body.quantity ? Number(body.quantity) : undefined,
      total_price: body.total_price ? Number(body.total_price) : undefined,
      tax_percent: body.tax_percent ? Number(body.tax_percent) : undefined,
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    };

    const sale = await createSale(saleData);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create sale",
      },
      { status: 400 },
    );
  }
}
