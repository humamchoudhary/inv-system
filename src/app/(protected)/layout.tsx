import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { headers } from "next/headers";
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  console.log(session);

  if (!session) {
    redirect("/signin");
  }

  return <>{children}</>;
}
