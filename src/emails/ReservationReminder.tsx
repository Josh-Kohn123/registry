import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
  Row,
  Column,
} from "@react-email/components";
import { t, isRtl, type EmailLocale } from "./translations";

interface GiftItem {
  title: string;
  imageUrl?: string;
  url: string;
  estimatedPrice?: number;
}

interface ReservationReminderProps {
  guestName: string;
  locale: EmailLocale;
  eventTitle: string;
  coupleName: string;
  items: GiftItem[];
  confirmUrl: string;
  cancelUrl: string;
}

export default function ReservationReminder({
  guestName,
  locale,
  eventTitle,
  coupleName,
  items,
  confirmUrl,
  cancelUrl,
}: ReservationReminderProps) {
  const rtl = isRtl(locale);
  const dir = rtl ? "rtl" : "ltr";
  const vars = { guestName, coupleName, eventTitle };
  const currency = t(locale, "ils");

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{t(locale, "reminderSubject", vars)}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={{ fontSize: "32px", textAlign: "center", margin: "0 0 16px" }}>⏰</Text>
            <Text style={headingStyle}>{t(locale, "reminderHeading")}</Text>
            <Text style={introStyle}>{t(locale, "reminderIntro", vars)}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Gift Summary */}
          <Section>
            <Text style={sectionTitleStyle}>{t(locale, "giftSummary")}</Text>
            {items.map((item, i) => (
              <Section key={i} style={itemCardStyle}>
                <Row>
                  {item.imageUrl && (
                    <Column style={{ width: "80px", verticalAlign: "top" }}>
                      <Img
                        src={item.imageUrl}
                        alt={item.title}
                        width={72}
                        height={72}
                        style={itemImageStyle}
                      />
                    </Column>
                  )}
                  <Column style={{ verticalAlign: "top", paddingLeft: item.imageUrl ? "12px" : "0" }}>
                    <Text style={itemTitleStyle}>{item.title}</Text>
                    {item.estimatedPrice != null && (
                      <Text style={itemPriceStyle}>
                        {t(locale, "priceLabel")}: {currency}{item.estimatedPrice.toLocaleString()}
                      </Text>
                    )}
                    <Button href={item.url} style={shopButtonStyle}>
                      {t(locale, "shopNow")} →
                    </Button>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          <Hr style={hrStyle} />

          {/* Urgency + CTA */}
          <Section style={ctaSection}>
            <Text style={urgencyStyle}>{t(locale, "reminderUrgency")}</Text>
            <Button href={confirmUrl} style={confirmButtonStyle}>
              {t(locale, "confirmButton")}
            </Button>
            <Text style={{ textAlign: "center", margin: "8px 0", color: "#9ca3af", fontSize: "13px" }}>
              {rtl ? "או" : "or"}
            </Text>
            <Button href={cancelUrl} style={cancelButtonStyle}>
              {t(locale, "cancelButton")}
            </Button>
          </Section>

          <Hr style={hrStyle} />

          <Section>
            <Text style={footerStyle}>{t(locale, "footerNote")}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 20px",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#111827",
  margin: "0 0 8px",
};

const introStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#4b5563",
  lineHeight: "1.6",
  margin: 0,
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "17px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 12px",
};

const itemCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px",
};

const itemImageStyle: React.CSSProperties = {
  borderRadius: "6px",
  objectFit: "cover",
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 4px",
};

const itemPriceStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 8px",
};

const shopButtonStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  padding: "8px 0",
};

const urgencyStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#d97706",
  fontWeight: "500",
  textAlign: "center",
  margin: "0 0 16px",
};

const confirmButtonStyle: React.CSSProperties = {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "14px 32px",
  borderRadius: "8px",
  textDecoration: "none",
  display: "inline-block",
  width: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "500",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "1px solid #dc2626",
  textDecoration: "none",
  display: "inline-block",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center",
  margin: 0,
};
