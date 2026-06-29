"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/auth-service";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    const { error } = await signOut();

    if (error) {
      toast.error(error.message);
      setIsSigningOut(false);
      return;
    }

    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
