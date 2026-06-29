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
import { Textarea } from "@/components/ui/textarea";
import {
  createPersonAction,
  updatePersonAction,
} from "@/features/persons/person-actions";
import { PERSON_GENDERS } from "@/lib/person/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { Person, PersonGender } from "@/types/person";

type PersonFormProps = {
  familyId: string;
  person?: Person;
  mode: "create" | "edit";
};

export function PersonForm({ familyId, person, mode }: PersonFormProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [gender, setGender] = useState<PersonGender | undefined>(
    person?.gender ?? undefined,
  );

  function handleSubmit(formData: FormData) {
    if (gender) {
      formData.set("gender", gender);
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPersonAction(familyId, formData)
          : await updatePersonAction(familyId, person!.id, formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.success) {
        toast.success(result.success);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="firstName">{t("person.firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={person?.first_name ?? ""}
            required
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="middleName">{t("person.middleName")}</Label>
          <Input
            id="middleName"
            name="middleName"
            defaultValue={person?.middle_name ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lastName">{t("person.lastName")}</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={person?.last_name ?? ""}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="otherName">{t("person.otherName")}</Label>
        <Input
          id="otherName"
          name="otherName"
          defaultValue={person?.other_name ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="gender">{t("person.gender")}</Label>
          <Select
            value={gender ?? ""}
            onValueChange={(value) =>
              setGender(value ? (value as PersonGender) : undefined)
            }
            disabled={isPending}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder={t("person.selectGender")} />
            </SelectTrigger>
            <SelectContent>
              {PERSON_GENDERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`person.genderLabels.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="birthDate">{t("person.birthDate")}</Label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={person?.birth_date ?? ""}
            disabled={isPending}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="deathDate">{t("person.deathDate")}</Label>
          <Input
            id="deathDate"
            name="deathDate"
            type="date"
            defaultValue={person?.death_date ?? ""}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="occupation">{t("person.occupation")}</Label>
        <Input
          id="occupation"
          name="occupation"
          defaultValue={person?.occupation ?? ""}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="biography">{t("person.biography")}</Label>
        <Textarea
          id="biography"
          name="biography"
          rows={5}
          defaultValue={person?.biography ?? ""}
          disabled={isPending}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending
          ? mode === "create"
            ? t("common.creating")
            : t("common.saving")
          : mode === "create"
            ? t("person.createPerson")
            : t("common.save")}
      </Button>
    </form>
  );
}
