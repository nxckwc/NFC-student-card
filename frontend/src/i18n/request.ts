// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import enMessages from "../messages/en.json";
import thMessages from "../messages/th.json";

const messages = {
  en: enMessages,
  th: thMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;

  const locale = routing.locales.find((supportedLocale) => supportedLocale === requestedLocale)
    ?? routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});