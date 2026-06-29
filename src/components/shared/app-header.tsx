import Link from "next/link";
import { TreePine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FamilySwitcher } from "@/features/families/family-switcher";
import { SignOutButton } from "@/features/auth/sign-out-button";
import {
  getActiveFamily,
  getUserFamilies,
} from "@/features/families/family-service";
import { getActiveFamilyIdFromCookie } from "@/lib/family/active-family-cookie";
import { getUser } from "@/lib/auth/get-user";

export async function AppHeader() {
  const user = await getUser();

  const families = user ? await getUserFamilies(user.id) : [];
  const activeFamily = user ? await getActiveFamily(user.id) : null;
  const activeFamilyId =
    (await getActiveFamilyIdFromCookie()) ?? activeFamily?.id ?? null;

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <TreePine className="size-5" aria-hidden="true" />
          <span className="font-semibold">Family Tree</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {families.length > 0 && (
                <FamilySwitcher
                  families={families}
                  activeFamilyId={activeFamilyId}
                />
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/families">Families</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
