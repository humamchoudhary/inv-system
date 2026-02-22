"use server";
import { signIn } from "@/auth";
import { createUser, UserExistsError } from "@/db/service/user";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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

    console.log("login");
    return { message: "", error: false };
  } catch (e: unknown) {
    console.log(e);
    if (isRedirectError(e)) {
      throw e; // Re-throw so Next.js can handle the redirect
    }
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return { error: true, message: "Invalid credentials" };
      }
    }

    if (e instanceof UserExistsError) {
      return { error: true, message: "User already exists" };
    }

    return {
      error: true,
      message: "Could not sign in, please try again",
    };
  }
}
