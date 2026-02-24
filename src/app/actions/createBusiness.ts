"use server";

import { auth, unstable_update } from "@/auth";
import { createBusiness } from "@/db/service/business";

export async function createBusinessAction(
  prevState: { error: boolean; message: string } | null,
  formData: FormData,
) {
  const name = formData.get("name") as string;
  const business_type = formData.get("business_type") as string;
  const currency = formData.get("currency") as string;

  const session = await auth();
  if (session && session?.user) {
    await createBusiness(name, business_type, currency, session.user.id);
    await unstable_update({
      user: { first_auth: false },
    });

    return { message: "", error: false };
  }
  return { message: "UnAuthorized", error: true };
}
