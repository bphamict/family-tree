"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileSpreadsheet, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importFamilyDataAction } from "@/features/data/data-actions";
import { useTranslations } from "@/lib/i18n/use-translator";

type DataImportExportPanelProps = {
  familyId: string;
  canImport: boolean;
};

type ImportFormat = "json" | "csv";

export function DataImportExportPanel({
  familyId,
  canImport,
}: DataImportExportPanelProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>("json");
  const [isImporting, startImportTransition] = useTransition();

  function downloadExport(format: "json" | "csv" | "csv-template") {
    const link = document.createElement("a");
    link.href = `/api/families/${familyId}/export?format=${format}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error(t("data.errors.selectFile"));
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("format", importFormat);

    startImportTransition(async () => {
      const result = await importFamilyDataAction(familyId, formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(result.success);
      }

      if (result.warnings.length > 0) {
        toast.message(t("data.importWarnings"), {
          description: result.warnings.slice(0, 3).join(" "),
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="size-5" aria-hidden />
            {t("data.exportTitle")}
          </CardTitle>
          <CardDescription>{t("data.exportDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => downloadExport("json")}
          >
            <FileText className="size-4" aria-hidden />
            {t("data.exportJson")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => downloadExport("csv")}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            {t("data.exportCsv")}
          </Button>
          {canImport && (
            <Button
              type="button"
              variant="ghost"
              className="justify-start"
              onClick={() => downloadExport("csv-template")}
            >
              {t("data.downloadTemplate")}
            </Button>
          )}
        </CardContent>
      </Card>

      {canImport ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="size-5" aria-hidden />
              {t("data.importTitle")}
            </CardTitle>
            <CardDescription>{t("data.importDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleImportSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-format">{t("data.importFormat")}</Label>
                <Select
                  value={importFormat}
                  onValueChange={(value) =>
                    setImportFormat(value as ImportFormat)
                  }
                >
                  <SelectTrigger id="import-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">{t("data.formatJson")}</SelectItem>
                    <SelectItem value="csv">{t("data.formatCsv")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="import-file">{t("data.importFile")}</Label>
                <Input
                  ref={fileInputRef}
                  id="import-file"
                  type="file"
                  accept={
                    importFormat === "csv"
                      ? ".csv,text/csv"
                      : ".json,application/json"
                  }
                  disabled={isImporting}
                />
              </div>

              <Button type="submit" disabled={isImporting}>
                {isImporting ? t("data.importing") : t("data.importAction")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("data.importTitle")}</CardTitle>
            <CardDescription>{t("data.importViewOnly")}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
