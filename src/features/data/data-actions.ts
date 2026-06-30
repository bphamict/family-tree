"use server";

import { revalidatePath } from "next/cache";

import { importFamilyData } from "@/features/data/data-import-service";
import { getFamilyById } from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";
import { canManagePersons } from "@/lib/family/permissions";
import { getTranslations } from "@/lib/i18n/translator";
import type { ImportResult } from "@/types/data-export";

type ActionResult = ImportResult & {
  error?: string;
  success?: string;
};

async function requireDataImport(familyId: string) {
  const t = await getTranslations();
  await requireUser();
  const family = await getFamilyById(familyId);

  if (!family || !canManagePersons(family.membership.role)) {
    return { error: t("data.errors.importPermission") };
  }

  return { family };
}

function revalidateFamilyDataPaths(familyId: string) {
  revalidatePath(`/families/${familyId}`);
  revalidatePath(`/families/${familyId}/data`);
  revalidatePath(`/families/${familyId}/persons`);
  revalidatePath(`/families/${familyId}/tree`);
  revalidatePath(`/families/${familyId}/timeline`);
  revalidatePath(`/families/${familyId}/kinship`);
}

export async function importFamilyDataAction(
  familyId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getTranslations();
  const permission = await requireDataImport(familyId);

  if ("error" in permission && permission.error) {
    return {
      persons: 0,
      relationships: 0,
      events: 0,
      skippedRows: 0,
      warnings: [],
      error: permission.error,
    };
  }

  const file = formData.get("file");
  const formatValue = formData.get("format");

  if (!(file instanceof File) || file.size === 0) {
    return {
      persons: 0,
      relationships: 0,
      events: 0,
      skippedRows: 0,
      warnings: [],
      error: t("data.errors.selectFile"),
    };
  }

  const format = formatValue === "csv" ? "csv" : "json";
  const content = await file.text();

  try {
    const result = await importFamilyData(familyId, content, format);

    if (
      result.persons === 0 &&
      result.relationships === 0 &&
      result.events === 0
    ) {
      return {
        ...result,
        error: t("data.errors.nothingImported"),
      };
    }

    revalidateFamilyDataPaths(familyId);

    return {
      ...result,
      success: t("data.toast.imported", {
        persons: result.persons,
        relationships: result.relationships,
        events: result.events,
      }),
    };
  } catch (error) {
    return {
      persons: 0,
      relationships: 0,
      events: 0,
      skippedRows: 0,
      warnings: [],
      error:
        error instanceof Error ? error.message : t("data.errors.importFailed"),
    };
  }
}
