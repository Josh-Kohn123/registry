"use client";

import { useState } from "react";
import { WalletProvider } from "@/types/fund";
import { useTranslations, useLocale } from "next-intl";

interface WalletSetupGuideProps {
  provider: WalletProvider;
}

interface Step {
  title: string;
  description: string;
  tip?: string;
}

const PAYBOX_STEPS_EN: Step[] = [
  {
    title: "Download the PayBox app",
    description:
      'Install PayBox from the App Store (iOS) or Google Play (Android). Search for "PayBox — Digital Wallet" and download the official app from payboxapp.com.',
    tip: "Make sure you download the official PayBox app — it has a blue icon.",
  },
  {
    title: "Register with your phone number",
    description:
      "Open the app and sign up using your Israeli mobile number. You'll receive an SMS verification code. Complete registration by entering your full name and Israeli ID number.",
  },
  {
    title: "Link your bank account",
    description:
      'In the app menu, go to "Settings" → "Bank Account" (חשבון בנק). Enter your bank details so you can withdraw received gifts to your account.',
    tip: "This step is required before you can receive and withdraw money.",
  },
  {
    title: "Get your personal payment link",
    description:
      'Tap your profile icon (top of the home screen) → tap "Personal payment link" (לינק אישי לתשלום). Your link will look like: https://payboxapp.com/page/yourname',
  },
  {
    title: "Copy and paste the link below",
    description:
      'Tap "Copy link" or "Share" to copy your payment link. Paste it into the "Wallet Link" field below.',
    tip: "Open the link in your browser to confirm it works before saving.",
  },
];

const PAYBOX_STEPS_HE: Step[] = [
  {
    title: "הורידו את אפליקציית PayBox",
    description:
      'התקינו את PayBox מ-App Store (iOS) או Google Play (Android). חפשו "PayBox ארנק דיגיטלי" והורידו את האפליקציה הרשמית מ-payboxapp.com.',
    tip: "וודאו שאתם מורידים את האפליקציה הרשמית עם האייקון הכחול.",
  },
  {
    title: "הירשמו עם מספר הטלפון שלכם",
    description:
      "פתחו את האפליקציה והירשמו עם מספר הנייד הישראלי שלכם. תקבלו קוד אימות ב-SMS. השלימו את הרישום עם שם מלא ומספר תעודת זהות.",
  },
  {
    title: "קשרו חשבון בנק",
    description:
      'בתפריט האפליקציה, עברו ל"הגדרות" ← "חשבון בנק". הזינו את פרטי הבנק שלכם כדי לאפשר משיכת כסף שתקבלו.',
    tip: "שלב זה נדרש לפני שתוכלו לקבל ולמשוך כסף.",
  },
  {
    title: "קבלו את הקישור האישי שלכם לתשלום",
    description:
      'לחצו על אייקון הפרופיל (בראש המסך הראשי) ← לחצו על "לינק אישי לתשלום". הקישור שלכם ייראה כך: https://payboxapp.com/page/yourname',
  },
  {
    title: "העתיקו והדביקו את הקישור למטה",
    description:
      'לחצו "העתק קישור" או "שתף" כדי להעתיק את קישור התשלום שלכם. הדביקו אותו בשדה "קישור ארנק" למטה.',
    tip: "פתחו את הקישור בדפדפן לפני שמירה כדי לוודא שהוא עובד.",
  },
];

const BIT_STEPS_EN: Step[] = [
  {
    title: "Open the Bit app",
    description:
      "Make sure you have the Bit app installed and your account is set up with a linked bank account.",
  },
  {
    title: "Go to your Bit profile",
    description:
      'Tap on your profile icon. Find the "My Bit Link" or "Bit.ly" option to generate your personal payment link.',
  },
  {
    title: "Copy your Bit link",
    description:
      'Copy the link and paste it in the "Wallet Link" field below. Guests on mobile will be taken directly to the Bit app. Desktop users will see a QR code.',
    tip: "Your Bit link usually looks like: https://bit.co.il/p/your-name",
  },
];

const BIT_STEPS_HE: Step[] = [
  {
    title: "פתחו את אפליקציית ביט",
    description:
      "וודאו שהאפליקציה מותקנת והחשבון שלכם מוגדר עם חשבון בנק מקושר.",
  },
  {
    title: "עברו לפרופיל שלכם בביט",
    description:
      'לחצו על אייקון הפרופיל שלכם. מצאו את האפשרות "הלינק שלי בביט" כדי ליצור קישור תשלום אישי.',
  },
  {
    title: "העתיקו את קישור הביט שלכם",
    description:
      'העתיקו את הקישור והדביקו אותו בשדה "קישור ארנק" למטה. אורחים במובייל יועברו ישירות לאפליקציית ביט. משתמשי מחשב יראו קוד QR.',
    tip: "קישור הביט שלכם בדרך כלל נראה כך: https://bit.co.il/p/your-name",
  },
];

export function WalletSetupGuide({ provider }: WalletSetupGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const isRtl = locale === "he";

  if (provider === "OTHER") return null;

  const steps =
    provider === "PAYBOX"
      ? isRtl
        ? PAYBOX_STEPS_HE
        : PAYBOX_STEPS_EN
      : isRtl
      ? BIT_STEPS_HE
      : BIT_STEPS_EN;

  const providerName = provider === "PAYBOX" ? "PayBox" : "Bit";
  const title = isRtl
    ? `איך להגדיר ${providerName}?`
    : `How to set up ${providerName}?`;

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {title}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="border-t border-blue-200 pt-3" />
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {step.description}
                </p>
                {step.tip && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick links */}
          <div className="border-t border-blue-200 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">
              {isRtl ? "קישורים שימושיים:" : "Useful links:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {provider === "PAYBOX" ? (
                <>
                  <a
                    href="https://www.payboxapp.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isRtl ? "אתר PayBox" : "PayBox Website"} ↗
                  </a>
                  <a
                    href="https://apps.apple.com/il/app/paybox-%D7%AA%D7%A9%D7%9C%D7%95%D7%9E%D7%99%D7%9D-%D7%95%D7%94%D7%A2%D7%91%D7%A8%D7%AA-%D7%9B%D7%A1%D7%A3/id895491053"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    App Store ↗
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.payboxapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Google Play ↗
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="https://www.bit.co.il"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isRtl ? "אתר ביט" : "Bit Website"} ↗
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
