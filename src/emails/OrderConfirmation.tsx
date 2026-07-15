import {
  Body,
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

export interface OrderConfirmationEmailProps {
  firstName: string;
  itemLine: string;
  amountPaid: string | null;
  addressLines: string[];
}

export function OrderConfirmationEmail({ firstName, itemLine, amountPaid, addressLines }: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your White Rabbit order is confirmed</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: fontSans, margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
          <Text style={{ fontSize: 36, textAlign: 'center', margin: '0 0 8px' }}>🐰👍</Text>
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
            ORDER CONFIRMED
          </Heading>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: '26px', textAlign: 'center', margin: 0 }}>
            Thanks, {firstName}! Your order is confirmed.
          </Text>
          <Section
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '16px 20px',
              margin: '24px 0',
            }}
          >
            <Text style={{ color: colors.accent, fontFamily: fontMono, fontSize: 14, margin: '0 0 4px' }}>
              {itemLine}
            </Text>
            {amountPaid && (
              <Text style={{ color: colors.text, fontFamily: fontMono, fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>
                Total charged: {amountPaid}
              </Text>
            )}
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                margin: '0 0 6px',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Shipping to
            </Text>
            {addressLines.map(line => (
              <Text key={line} style={{ color: colors.text, fontSize: 14, margin: 0, lineHeight: '20px' }}>
                {line}
              </Text>
            ))}
          </Section>
          <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: '22px', textAlign: 'center' }}>
            Our rabbit hole crew is already hopping on production and shipping. We
            can&apos;t promise this gear will fix your frame, but it will
            absolutely upgrade your dance floor swagger.
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

export default OrderConfirmationEmail;
