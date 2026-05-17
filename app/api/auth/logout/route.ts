import { logoutAction } from "@/lib/actions/auth-actions";
export async function POST() { await logoutAction(); }
