import users from "../schema/users";
import { db } from "..";
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { business } from "../schema";

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existing) {
    throw new Error("User Alreadt Exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await db.insert(users).values({
    email: data.email,
    password: hashedPassword,
    name: data.name,
  });
};
export async function getUser(user_id: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, user_id),
  });
}

export async function swtichUserBusiness(
  user_id: string,
  new_business_id: string,
) {
  const new_business = await db.query.business.findFirst({
    where: and(eq(business.id, new_business_id), eq(business.user_id, user_id)),
  });
  if (new_business) {
    const update = await db
      .update(users)
      .set({ last_business: new_business_id });
    console.log(update);
    return true;
  }
  return false;
}
