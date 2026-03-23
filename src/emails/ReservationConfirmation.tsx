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

interface ShippingAddress {
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone?: string;
  notes?: string;
}

interface ReservationConfirmationProps {
  guestName: string;
  locale: EmailLocale;
  eventTitle: string;
  coupleName: string;
  items: GiftItem[];
  addresses: ShippingAddress[];
  confirmUrl: string;
  cancelUrl: string;
}

export default function ReservationConfirmation({
  guestName,
  locale,
  eventTitle,
  coupleName,
  items,
  addresses,
  confirmUrl,
  cancelUrl,
}: ReservationConfirmationProps) {
  const rtl = isRtl(locale);
  const dir = rtl ? "rtl" : "ltr";
  const vars = { guestName, coupleName, eventTitle };
  const currency = t(locale, "ils");

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{t(locale, "confirmationSubject", vars)}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={headingStyle}>{t(locale, "confirmationHeading")}</Text>
            <Text style={introStyle}>{t(locale, "confirmationIntro", vars)}</Text>
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

          {/* Shipping Addresses */}
          {addresses.length > 0 && (
            <Section>
              <Text style={sectionTitleStyle}>{t(locale, "shippingAddresses")}</Text>
              <Text style={shippingNoteStyle}>{t(locale, "shippingNote")}</Text>
              {addresses.map((addr, i) => (
                <Section key={i} style={addressCardStyle}>
                  <Text style={addressNameStyle}>{addr.recipientName}</Text>
                  <Text style={addressLineStyle}>{addr.line1}</Text>
                  {addr.line2 && <Text style={addressLineStyle}>{addr.line2}</Text>}
                  <Text style={addressLineStyle}>
                    {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ""}
                  </Text>
                  {addr.phone && <Text style={addressLineStyle}>📞 {addr.phone}</Text>}
                  {addr.notes && (
                    <Text style={{ ...addressLineStyle, fontStyle: "italic", color: "#6b7280" }}>
                      {addr.notes}
                    </Text>
                  )}
                </Section>
              ))}
            </Section>
          )}

          {addresses.length > 0 && <Hr style={hrStyle} />}

          {/* CTA Buttons */}
          <Section style={ctaSection}>
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

          {/* Footer */}
          <Section>
            <Text style={expiryStyle}>{t(locale, "expiryNotice")}</Text>
            <Text style={footerStyle}>{t(locale, "footerNote")}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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

const shippingNoteStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 12px",
};

const addressCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};

const addressNameStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 4px",
};

const addressLineStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "0",
  lineHeight: "1.5",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center",
  padding: "8px 0",
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

const expiryStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#d97706",
  textAlign: "center",
  fontWeight: "500",
  margin: "0 0 8px",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center",
  margin: 0,
};
