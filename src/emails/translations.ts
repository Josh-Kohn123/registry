export type EmailLocale = "en" | "he";

const translations = {
  en: {
    // Confirmation email
    confirmationSubject: "Your gift reservation for {eventTitle}",
    confirmationHeading: "You reserved a gift!",
    confirmationIntro: "Hi {guestName}, you've reserved the following gift for {coupleName}'s {eventTitle}.",
    giftSummary: "Gift Summary",
    bundleLabel: "Bundle",
    priceLabel: "Price",
    shopNow: "Shop Now",
    shippingAddresses: "Shipping Addresses",
    shippingNote: "Please ship to one of the following addresses:",
    confirmButton: "I Purchased This",
    cancelButton: "Cancel Reservation",
    expiryNotice: "This reservation expires in 24 hours. Please confirm your purchase before then.",
    footerNote: "You received this email because you reserved a gift on SimchaList.",

    // Reminder email
    reminderSubject: "Reminder: Complete your gift purchase for {eventTitle}",
    reminderHeading: "Don't forget your gift!",
    reminderIntro: "Hi {guestName}, you reserved a gift for {coupleName} about an hour ago. Have you completed your purchase?",
    reminderUrgency: "Your reservation will expire soon. Please confirm or cancel below.",

    // Expired email
    expiredSubject: "Your reservation has expired",
    expiredHeading: "Reservation Expired",
    expiredMessage: "Hi {guestName}, your reservation for \"{itemTitle}\" for {coupleName}'s {eventTitle} has expired. The item is now available for others to reserve.",
    expiredFooter: "If you already purchased the item, please contact the couple directly.",

    // Shared
    ils: "ILS",
    notAvailable: "N/A",
  },
  he: {
    // Confirmation email
    confirmationSubject: "שריון המתנה שלך ל{eventTitle}",
    confirmationHeading: "שריינת מתנה!",
    confirmationIntro: "היי {guestName}, שריינת את המתנה הבאה ל{eventTitle} של {coupleName}.",
    giftSummary: "סיכום המתנה",
    bundleLabel: "חבילה",
    priceLabel: "מחיר",
    shopNow: "קנה עכשיו",
    shippingAddresses: "כתובות למשלוח",
    shippingNote: "שלח לאחת מהכתובות הבאות:",
    confirmButton: "רכשתי את המתנה",
    cancelButton: "בטל שריון",
    expiryNotice: "השריון יפוג בעוד 24 שעות. אנא אשר את הרכישה לפני כן.",
    footerNote: "קיבלת אימייל זה כי שריינת מתנה ב-SimchaList.",

    // Reminder email
    reminderSubject: "תזכורת: השלם את רכישת המתנה ל{eventTitle}",
    reminderHeading: "אל תשכח את המתנה!",
    reminderIntro: "היי {guestName}, שריינת מתנה ל{coupleName} לפני כשעה. האם השלמת את הרכישה?",
    reminderUrgency: "השריון יפוג בקרוב. אנא אשר או בטל למטה.",

    // Expired email
    expiredSubject: "השריון שלך פג תוקף",
    expiredHeading: "השריון פג תוקף",
    expiredMessage: "היי {guestName}, השריון שלך עבור \"{itemTitle}\" ל{eventTitle} של {coupleName} פג תוקף. הפריט זמין כעת לאחרים.",
    expiredFooter: "אם כבר רכשת את הפריט, צור קשר עם הזוג ישירות.",

    // Shared
    ils: "₪",
    notAvailable: "לא זמין",
  },
} as const;

type TranslationKey = keyof (typeof translations)["en"];

export function t(locale: EmailLocale, key: TranslationKey, vars?: Record<string, string>): string {
  let text: string = translations[locale]?.[key] || translations.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return text;
}

export function isRtl(locale: EmailLocale): boolean {
  return locale === "he";
}
