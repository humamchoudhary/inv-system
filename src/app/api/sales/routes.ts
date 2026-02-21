// app/api/users/[id]/route.ts
import { auth } from "@/auth";
import { getTotalSales, getUserActiveBusiness } from "@/db/service/business";
import { getBusinessSheets } from "@/db/service/sale-sheet";
import { getUser } from "@/db/service/user";
import { NextRequest } from "next/server";

// GET /api/sales
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return new Response(
      JSON.stringify({ error: true, message: "UnAuthorized" }),
      {
        status: 403,
      },
    );
  }
  const activeBusiness = await getUserActiveBusiness(session.user.id);

  const business_sales = await getTotalSales(activeBusiness!.id);

  return new Response(
    JSON.stringify({
      ...business_sales,
    }),
    {
      status: 200,
    },
  );
}

// POST /api/sales
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  return new Response(JSON.stringify({ id, name: `User ${id}` }), {
    status: 200,
  });
}
