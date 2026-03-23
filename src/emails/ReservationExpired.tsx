import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";
import { t, isRtl, type EmailLocale } from "./translations";

interface ReservationExpiredProps {
  guestName: string;
  locale: EmailLocale;
  eventTitle: string;
  coupleName: string;
  itemTitle: string;
}

export default function ReservationExpired({
  guestName,
  locale,
  eventTitle,
  coupleName,
  itemTitle,
}: ReservationExpiredProps) {
  const rtl = isRtl(locale);
  const dir = rtl ? "rtl" : "ltr";
  const vars = { guestName, coupleName, eventTitle, itemTitle };

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{t(locale, "expiredSubject")}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={{ fontSize: "32px", textAlign: "center", margin: "0 0 16px" }}>⌛</Text>
            <Text style={headingStyle}>{t(locale, "expiredHeading")}</Text>
          </Section>

          <Hr style={hrStyle} />

          <Section>
            <Text style={messageStyle}>{t(locale, "expiredMessage", vars)}</Text>
            <Text style={footerNoteStyle}>{t(locale, "expiredFooter")}</Text>
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

const hrStyle: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const messageStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#4b5563",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  fontStyle: "italic",
  margin: 0,
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  textAlign: "center",
  margin: 0,
};
