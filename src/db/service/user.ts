import users from "../schema/users";
import { db } from "..";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

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
