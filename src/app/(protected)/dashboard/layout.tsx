import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  console.log(session);
  if (!session) {
    redirect("/signin");
  } else if (session.user.first_auth) {
    redirect("/welcome");
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
