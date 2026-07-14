export async function verifyTurnstile(token: string, secretKey: string): Promise<{ success: boolean; codes: string[] }> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: secretKey, response: token }),
  });
  const data = (await res.json()) as { success: boolean; 'error-codes': string[] };
  return { success: data.success, codes: data['error-codes'] ?? [] };
}
