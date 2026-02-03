import { NextRequest, NextResponse } from "next/server";
import { getSalesAnalytics } from "@/db/service/sale-entry";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateRange =
      (searchParams.get("range") as "7d" | "30d" | "90d" | "1y" | "all") ||
      "30d";

    const data = await getSalesAnalytics(dateRange);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
      },
      { status: 500 },
    );
  }
}
