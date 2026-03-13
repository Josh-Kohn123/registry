import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimchaList - מרשם המתנות הישראלי",
  description: "SimchaList - The Israeli gifting registry for weddings and celebrations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
