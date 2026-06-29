"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFamilyAction } from "@/features/families/family-actions";

export function CreateFamilyForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFamilyAction(formData);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Family name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Nguyen Family"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="A short description of this family..."
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create family"}
      </Button>
    </form>
  );
}
