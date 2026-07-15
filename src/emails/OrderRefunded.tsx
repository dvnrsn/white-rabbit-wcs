import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { colors, fontMono, fontSans } from './theme';

export interface OrderRefundedEmailProps {
  firstName: string;
  amountRefunded: string;
  isFullRefund: boolean;
}

export function OrderRefundedEmail({ firstName, amountRefunded, isFullRefund }: OrderRefundedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {isFullRefund ? 'Your White Rabbit order has been refunded' : 'A refund has been issued for your White Rabbit order'}
      </Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: fontSans, margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
          <Text style={{ fontSize: 36, textAlign: 'center', margin: '0 0 8px' }}>🐰💸</Text>
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
            REFUNDED
          </Heading>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: '26px', textAlign: 'center', margin: 0 }}>
            Hi {firstName}, {isFullRefund ? 'your order has been fully refunded.' : 'a partial refund has been issued for your order.'}
          </Text>
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
              {isFullRefund ? 'Amount Refunded' : 'Partial Refund'}
            </Text>
            <Text style={{ color: colors.text, fontFamily: fontMono, fontSize: 22, margin: 0 }}>
              {amountRefunded}
            </Text>
          </Section>
          <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: '22px', textAlign: 'center', margin: 0 }}>
            It can take 5-10 business days to show up on your statement, depending on your bank.
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

export default OrderRefundedEmail;
