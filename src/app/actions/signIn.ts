"use server";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function signInAction(
  prevState: { error: boolean; message: string } | null,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      redirectTo: "/dashboard",
      email: formData.get("email"),
      password: formData.get("password"),
    });
    return { message: "", error: false };
  } catch (e: unknown) {
    if (isRedirectError(e)) {
      throw e; // Re-throw so Next.js can handle the redirect
    }
    if (e instanceof AuthError) {
      if (e.type === "CredentialsSignin") {
        return { error: true, message: "Invalid credentials" };
      }
    }
    console.log(e);
    return {
      error: true,
      message: "Could not sign in, please try again",
    };
  }
}
