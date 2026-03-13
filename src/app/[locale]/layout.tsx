import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SimchaList - מרשם המתנות הישראלי",
  description: "SimchaList - The Israeli gifting registry for weddings and celebrations",
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();
  const isRtl = locale === "he";

  return (
    <div lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <NextIntlClientProvider messages={messages}>
        <Navbar />
        <main>{children}</main>
      </NextIntlClientProvider>
    </div>
  );
}
