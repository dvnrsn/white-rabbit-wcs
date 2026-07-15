import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { colors, fontMono, fontSans } from './theme';

export interface OrderShippedEmailProps {
  firstName: string;
  itemLine: string;
  carrier?: {
    code: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
}

export function OrderShippedEmail({ firstName, itemLine, carrier }: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your White Rabbit order is on its way</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: fontSans, margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
          <Text style={{ fontSize: 36, textAlign: 'center', margin: '0 0 8px' }}>🐰💨</Text>
          <Heading
            style={{
              color: colors.accent,
              fontFamily: fontMono,
              fontSize: 26,
              letterSpacing: 2,
              textAlign: 'center',
              margin: '0 0 24px',
            }}
          >
            ON ITS WAY
          </Heading>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: '26px', textAlign: 'center', margin: 0 }}>
            Hi {firstName}, {itemLine} just hopped out of the warehouse and is headed your way.
          </Text>
          {carrier && (
            <Section
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '20px',
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  margin: '0 0 6px',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {carrier.code}
              </Text>
              <Text style={{ color: colors.text, fontFamily: fontMono, fontSize: 16, margin: '0 0 16px' }}>
                {carrier.trackingNumber}
              </Text>
              {carrier.trackingUrl && (
                <Button
                  href={carrier.trackingUrl}
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.bg,
                    fontFamily: fontMono,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    borderRadius: 6,
                    padding: '10px 24px',
                    textDecoration: 'none',
                  }}
                >
                  TRACK PACKAGE
                </Button>
              )}
            </Section>
          )}
          <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: '22px', textAlign: 'center' }}>
            It&apos;s making its way through the rabbit hole straight to your door. Hang tight.
          </Text>
          <Hr style={{ borderColor: colors.border, margin: '24px 0' }} />
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', margin: 0 }}>
            Questions? Just reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderShippedEmail;
