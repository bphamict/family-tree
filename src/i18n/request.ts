import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/config";
import { en, type Messages } from "@/lib/i18n/messages/en";
import { vi } from "@/lib/i18n/messages/vi";

const dictionaries: Record<Locale, Messages> = {
  en,
  vi,
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieValue && isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;

  return {
    locale,
    messages: dictionaries[locale],
  };
});
