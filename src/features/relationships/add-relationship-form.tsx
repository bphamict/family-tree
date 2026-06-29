"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRelationshipAction } from "@/features/relationships/relationship-actions";
import {
  CREATE_RELATIONSHIP_TYPES,
  type CreateRelationshipType,
} from "@/lib/relationship/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import { formatPersonName, type Person } from "@/types/person";

type AddRelationshipFormProps = {
  familyId: string;
  personId: string;
  personOptions: Person[];
};

export function AddRelationshipForm({
  familyId,
  personId,
  personOptions,
}: AddRelationshipFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [relationshipType, setRelationshipType] =
    useState<CreateRelationshipType>("parent");
  const [relatedPersonId, setRelatedPersonId] = useState<string>("");

  function handleSubmit(formData: FormData) {
    formData.set("relationshipType", relationshipType);
    formData.set("relatedPersonId", relatedPersonId);

    startTransition(async () => {
      const result = await createRelationshipAction(
        familyId,
        personId,
        formData,
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.success);
      setRelatedPersonId("");
    });
  }

  if (personOptions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("relationship.needMorePeople")}
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="relationshipType">{t("relationship.type")}</Label>
          <Select
            value={relationshipType}
            onValueChange={(value) =>
              setRelationshipType(value as CreateRelationshipType)
            }
            disabled={isPending}
          >
            <SelectTrigger id="relationshipType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREATE_RELATIONSHIP_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`relationship.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="relatedPersonId">
            {t("relationship.relatedPerson")}
          </Label>
          <Select
            value={relatedPersonId}
            onValueChange={setRelatedPersonId}
            disabled={isPending}
          >
            <SelectTrigger id="relatedPersonId">
              <SelectValue placeholder={t("relationship.selectPerson")} />
            </SelectTrigger>
            <SelectContent>
              {personOptions.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {formatPersonName(person)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startDate">{t("relationship.startDate")}</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="endDate">{t("relationship.endDate")}</Label>
          <Input id="endDate" name="endDate" type="date" disabled={isPending} />
        </div>
      </div>

      <Button type="submit" disabled={isPending || !relatedPersonId}>
        {isPending
          ? t("relationship.adding")
          : t("relationship.addRelationship")}
      </Button>
    </form>
  );
}
