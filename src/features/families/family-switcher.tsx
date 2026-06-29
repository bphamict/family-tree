"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveFamilyAction } from "@/features/families/family-actions";
import { cn } from "@/lib/utils";
import type { FamilyWithMembership } from "@/types/family";

type FamilySwitcherProps = {
  families: FamilyWithMembership[];
  activeFamilyId: string | null;
};

export function FamilySwitcher({
  families,
  activeFamilyId,
}: FamilySwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeFamily =
    families.find((family) => family.id === activeFamilyId) ?? families[0];

  if (!activeFamily || families.length === 0) {
    return null;
  }

  function handleSelect(familyId: string) {
    startTransition(async () => {
      await setActiveFamilyAction(familyId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[220px] justify-between"
          disabled={isPending}
        >
          <span className="truncate">{activeFamily.name}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {families.map((family) => (
          <DropdownMenuItem
            key={family.id}
            onClick={() => handleSelect(family.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{family.name}</span>
            <Check
              className={cn(
                "size-4",
                family.id === activeFamily.id ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
