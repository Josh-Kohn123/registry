import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, EB_Garamond } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "SimchaList — מרשם המתנות הישראלי",
  description: "SimchaList — The Israeli gift registry for weddings and celebrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      suppressHydrationWarning
      className={`${dmSans.variable} ${ebGaramond.variable}`}
    >
      <body className="antialiased bg-cream text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
