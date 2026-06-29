import { getMessages } from "next-intl/server";

import type { Messages } from "@/lib/i18n/messages/en";

export type TranslationKey = string;

export type Translator = (
  key: TranslationKey,
  params?: Record<string, string | number>,
) => string;

function getNestedValue(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function createTranslator(messages: Messages): Translator {
  return function translate(
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string {
    const template = getNestedValue(messages, key) ?? key;

    if (!params) {
      return template;
    }

    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replaceAll(`{${paramKey}}`, String(paramValue)),
      template,
    );
  };
}

export async function getTranslations(): Promise<Translator> {
  const messages = (await getMessages()) as Messages;
  return createTranslator(messages);
}
