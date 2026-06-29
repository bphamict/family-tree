"use client";

import { useMessages } from "next-intl";
import { useMemo } from "react";

import type { Messages } from "@/lib/i18n/messages/en";
import { createTranslator, type Translator } from "@/lib/i18n/translator";

export function useTranslations(): Translator {
  const messages = useMessages() as Messages;

  return useMemo(() => createTranslator(messages), [messages]);
}
