// src/app/api/user/switch-business/route.ts
// POST — switches the authenticated user's active business by updating last_business.
// Validates that the target business actually belongs to the user.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { swtichUserBusiness } from "@/db/service/user";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { businessId } = body;

  if (!businessId) {
    return NextResponse.json(
      { message: "businessId is required" },
      { status: 400 },
    );
  }

  if (session && session?.user) {
    if (await swtichUserBusiness(session.user.id, businessId)) {
      return NextResponse.json({ success: true, activeBusinessId: businessId });
    }

    return NextResponse.json(
      { message: "Could not switch business" },
      { status: 404 },
    );
  }
  return false;
}
