"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n/use-translator";

const THEMES = ["light", "dark", "system"] as const;

type Theme = (typeof THEMES)[number];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeLabels: Record<Theme, string> = {
    light: t("common.lightMode"),
    dark: t("common.darkMode"),
    system: t("common.systemTheme"),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={t("common.theme")}
        >
          {mounted ? (
            <>
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </>
          ) : (
            <Sun className="size-4" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => setTheme(option)}
            className={theme === option ? "gap-2 font-medium" : "gap-2"}
          >
            {option === "light" && <Sun className="size-4" aria-hidden />}
            {option === "dark" && <Moon className="size-4" aria-hidden />}
            {option === "system" && <Monitor className="size-4" aria-hidden />}
            {themeLabels[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
