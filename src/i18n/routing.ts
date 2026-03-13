import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "he"],
  defaultLocale: "he",
});

export type Locale = (typeof routing.locales)[number];
