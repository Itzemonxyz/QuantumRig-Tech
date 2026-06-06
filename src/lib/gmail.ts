import { getAccessToken } from './auth';

export const sendReceiptEmail = async (orderId: string, total: number, itemsCount: number, toEmail: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');

  const message = [
    `To: ${toEmail}`,
    'Subject: QuantumRig Order Receipt',
    'Content-Type: text/html; charset=utf-8',
    '',
    `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
        <h1 style="color: #4f46e5;">QuantumRig</h1>
        <p>Your order has been received successfully!</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Order Summary</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Items:</strong> ${itemsCount}</p>
          <p><strong>Total Amount:</strong> ৳${Number(total || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
        <p>Thank you for shopping with By Gamers, For Gamers.</p>
      </div>
    `
  ].join('\r\n');

  // Base64url encode the message
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to send email');
  }

  return res.json();
};
