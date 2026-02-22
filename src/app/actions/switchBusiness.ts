"use server";

import { auth } from "@/auth";
import { swtichUserBusiness } from "@/db/service/user";

export default async function swtichBusinessAction(business_id: string) {
  const session = await auth();
  if (session && session?.user) {
    return await swtichUserBusiness(session.user.id, business_id);
  }
  return false;
}
