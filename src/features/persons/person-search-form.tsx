"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERSON_GENDERS } from "@/lib/person/constants";
import { useTranslations } from "@/lib/i18n/use-translator";
import type { PersonSearchFilters } from "@/types/person";

type PersonSearchFormProps = {
  filters: PersonSearchFilters;
};

export function PersonSearchForm({ filters }: PersonSearchFormProps) {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

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
        <select
          id="gender"
          name="gender"
          defaultValue={filters.gender ?? ""}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
        >
          <option value="">{t("common.allGenders")}</option>
          {PERSON_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {t(`person.genderLabels.${gender}`)}
            </option>
          ))}
        </select>
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
