// src/app/(protected)/profile/page.tsx
// Server component — fetches user + all businesses, renders ProfileClient

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/db/service/user";
import {
  getUserBusinesses,
  getUserActiveBusiness,
} from "@/db/service/business";
import ProfileClient, {
  type BusinessSummary,
  type ProfileProps,
} from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  const user = await getUser(session.user.id);
  if (!user) redirect("/signin");

  // All businesses for this user
  const businesses = await getUserBusinesses(session.user.id);

  // Active business (to mark the active indicator)
  const activeBusiness = await getUserActiveBusiness(session.user.id);

  const businessSummaries: BusinessSummary[] = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    currency: b.currency,
    isActive: activeBusiness?.id === b.id,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
  }));

  const props: ProfileProps = {
    userName: user.name ?? "",
    userEmail: user.email ?? session.user.email ?? "",
    userId: user.id,
    businesses: businessSummaries,
    activeBusinessId: activeBusiness?.id ?? null,
  };

  return <ProfileClient {...props} />;
}
