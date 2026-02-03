import users from "../schema/user";
import { db } from "..";
import bcrypt from "bcrypt";

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  console.log("========= CREATING USER ================");
  data.password = await bcrypt.hash(data.password, 10);
  const [user] = await db.insert(users).values(data).returning();
  console.log(user);
  return user;
};
