import { useLocale as useNextIntlLocale } from "next-intl";
import { getLocale as getNextIntlLocale } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";

export async function getLocale(): Promise<Locale> {
  const locale = await getNextIntlLocale();
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function useLocale(): Locale {
  const locale = useNextIntlLocale();
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
