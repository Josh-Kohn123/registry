import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: string = routing.defaultLocale;

  if (requestLocale instanceof Promise) {
    const resolved = await requestLocale;
    locale = resolved || routing.defaultLocale;
  } else {
    locale = requestLocale || routing.defaultLocale;
  }

  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (
      await import(`../../messages/${locale}.json`)
    ).default,
  };
});
