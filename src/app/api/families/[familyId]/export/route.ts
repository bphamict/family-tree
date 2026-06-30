import { NextResponse } from "next/server";

import {
  buildFamilyExportBundle,
  getCsvTemplate,
  serializeFamilyExportCsv,
  serializeFamilyExportJson,
} from "@/features/data/data-export-service";
import { getFamilyById } from "@/features/families/family-service";
import { requireUser } from "@/lib/auth/require-user";
import { canExportData } from "@/lib/family/permissions";
import type { ExportFormat } from "@/types/data-export";

type RouteContext = {
  params: Promise<{ familyId: string }>;
};

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-") || "family";
}

export async function GET(request: Request, context: RouteContext) {
  await requireUser();
  const { familyId } = await context.params;
  const family = await getFamilyById(familyId);

  if (!family || !canExportData()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get("format");
  const baseName = sanitizeFileName(family.name);

  if (formatParam === "csv-template") {
    return new NextResponse(getCsvTemplate(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="family-members-template.csv"',
      },
    });
  }

  const format: ExportFormat = formatParam === "csv" ? "csv" : "json";

  if (format === "csv") {
    const csv = await serializeFamilyExportCsv(familyId);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}-members.csv"`,
      },
    });
  }

  const bundle = await buildFamilyExportBundle(familyId);
  const json = serializeFamilyExportJson(bundle);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}-export.json"`,
    },
  });
}
