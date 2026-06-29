import type { PersonGender } from "@/types/person";

export const PERSON_GENDERS: PersonGender[] = [
  "male",
  "female",
  "other",
  "unknown",
];

export const GENDER_LABELS: Record<PersonGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  unknown: "Unknown",
};

export const PERSON_AVATARS_BUCKET = "person-avatars";
