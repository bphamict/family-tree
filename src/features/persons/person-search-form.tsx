"use client";

import { useState } from "react";

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
import { PERSON_GENDERS } from "@/lib/person/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { PersonGender, PersonSearchFilters } from "@/types/person";

type PersonSearchFormProps = {
  filters: PersonSearchFilters;
};

export function PersonSearchForm({ filters }: PersonSearchFormProps) {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const [gender, setGender] = useState(filters.gender ?? "all");

  return (
    <form
      method="get"
      className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <div className="grid gap-2 lg:col-span-2">
        <Label htmlFor="query">{t("person.searchByName")}</Label>
        <Input
          id="query"
          name="query"
          placeholder={t("person.namePlaceholder")}
          defaultValue={filters.query ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">{t("person.gender")}</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger id="gender">
            <SelectValue placeholder={t("common.allGenders")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allGenders")}</SelectItem>
            {PERSON_GENDERS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`person.genderLabels.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {gender !== "all" && (
          <input type="hidden" name="gender" value={gender as PersonGender} />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="birthYear">{t("person.birthYear")}</Label>
        <Input
          id="birthYear"
          name="birthYear"
          placeholder={t("person.yearPlaceholder", { year: 1950 })}
          defaultValue={filters.birthYear ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deathYear">{t("person.deathYear")}</Label>
        <Input
          id="deathYear"
          name="deathYear"
          placeholder={t("person.yearPlaceholder", { year: currentYear })}
          defaultValue={filters.deathYear ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="occupation">{t("person.occupation")}</Label>
        <Input
          id="occupation"
          name="occupation"
          placeholder={t("person.occupationPlaceholder")}
          defaultValue={filters.occupation ?? ""}
        />
      </div>

      <div className="flex items-end gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="includeArchived"
            value="true"
            defaultChecked={filters.includeArchived}
            className="size-4 rounded border"
          />
          {t("common.includeArchived")}
        </label>
      </div>

      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3">
        <Button type="submit">{t("common.search")}</Button>
        <Button type="button" variant="outline" asChild>
          <a href="?">{t("common.clear")}</a>
        </Button>
      </div>
    </form>
  );
}
