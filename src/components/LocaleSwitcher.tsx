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
    <div className="flex gap-2">
      <Button
        variant={locale === "en" ? "primary" : "outline"}
        size="sm"
        onClick={() => toggleLocale("en")}
        className="min-w-12"
      >
        EN
      </Button>
      <Button
        variant={locale === "he" ? "primary" : "outline"}
        size="sm"
        onClick={() => toggleLocale("he")}
        className="min-w-12"
      >
        עברית
      </Button>
    </div>
  );
}
