"use server";
import { signIn } from "@/auth";
import { createUser } from "@/db/service/user";

export async function signUp(
  prevState: { error: boolean; message: string } | null,
  formData: FormData,
) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    await createUser({ email, password, name });
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { message: "", error: false };
  } catch (e) {
    return { message: e as string, error: true };
  }
}
