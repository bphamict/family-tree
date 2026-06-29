import { cookies } from "next/headers";

import { ACTIVE_FAMILY_COOKIE } from "@/lib/family/constants";

export async function getActiveFamilyIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_FAMILY_COOKIE)?.value ?? null;
}
