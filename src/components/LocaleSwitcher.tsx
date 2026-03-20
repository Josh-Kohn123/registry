"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "./ui/Button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as any });
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => toggleLocale("en")}
        className={`px-2 py-1 transition-colors duration-150 ${
          locale === "en"
            ? "text-ink font-medium"
            : "text-mist hover:text-pebble"
        }`}
      >
        EN
      </button>
      <span className="text-warm-border">|</span>
      <button
        onClick={() => toggleLocale("he")}
        className={`px-2 py-1 transition-colors duration-150 ${
          locale === "he"
            ? "text-ink font-medium"
            : "text-mist hover:text-pebble"
        }`}
      >
        עברית
      </button>
    </div>
  );
}
