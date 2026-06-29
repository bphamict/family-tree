import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GENDER_LABELS, PERSON_GENDERS } from "@/lib/person/constants";
import type { PersonSearchFilters } from "@/types/person";

type PersonSearchFormProps = {
  filters: PersonSearchFilters;
};

export function PersonSearchForm({ filters }: PersonSearchFormProps) {
  return (
    <form method="get" className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="grid gap-2 lg:col-span-2">
        <Label htmlFor="query">Search by name</Label>
        <Input
          id="query"
          name="query"
          placeholder="First, middle, or last name"
          defaultValue={filters.query ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          name="gender"
          defaultValue={filters.gender ?? ""}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
        >
          <option value="">All genders</option>
          {PERSON_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {GENDER_LABELS[gender]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="birthYear">Birth year</Label>
        <Input
          id="birthYear"
          name="birthYear"
          placeholder="e.g. 1950"
          defaultValue={filters.birthYear ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deathYear">Death year</Label>
        <Input
          id="deathYear"
          name="deathYear"
          placeholder="e.g. 2020"
          defaultValue={filters.deathYear ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          name="occupation"
          placeholder="e.g. Teacher"
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
          Include archived
        </label>
      </div>

      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3">
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" asChild>
          <a href="?">Clear</a>
        </Button>
      </div>
    </form>
  );
}
