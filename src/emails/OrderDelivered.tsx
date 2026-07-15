import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components';
import { colors, fontMono, fontSans } from './theme';

export interface OrderDeliveredEmailProps {
  firstName: string;
  itemLine: string;
}

export function OrderDeliveredEmail({ firstName, itemLine }: OrderDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your White Rabbit order has been delivered</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: fontSans, margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
          <Text style={{ fontSize: 36, textAlign: 'center', margin: '0 0 8px' }}>🐰🎉</Text>
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
            DELIVERED
          </Heading>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: '26px', textAlign: 'center', margin: 0 }}>
            Hi {firstName}, {itemLine} just landed on your doorstep.
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: '22px', textAlign: 'center', margin: '24px 0 0' }}>
            Time to lace up and put it through its paces on the floor. We hope
            it upgrades your dance floor swagger exactly as promised.
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

export default OrderDeliveredEmail;
