import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requireAuthenticatedUser(redirectTo = "/login") {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdminUser(redirectTo = "/") {
  const user = await requireAuthenticatedUser();
  if (user.role !== "ADMIN") redirect(redirectTo);
  return user;
}
