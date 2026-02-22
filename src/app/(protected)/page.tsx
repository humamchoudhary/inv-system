// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getTotalSales,
  getUserActiveBusiness,
  getUserBusinesses,
} from "@/db/service/business";
import { getUser } from "@/db/service/user";
import HomePage from "@/components/Home";

export default async function Index() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }
  if (session.user.first_auth) {
    redirect("/welcome");
  }

  const business = await getUserActiveBusiness(session.user.id);
  if (!business) {
    redirect("/welcome");
  }
  const businesses = await getUserBusinesses(session.user.id);
  const todaySnapshot = await getTotalSales(business!.id);
  console.log(todaySnapshot);
  // redirect("/dashboard");
  return (
    <HomePage
      businessName={business!.name}
      businesses={businesses}
      currencyCode={business!.currency}
      activeBusinessId={business!.id}
      hasSales={true}
      snapshot={todaySnapshot}
    />
  );
}
