import nodemailer from 'nodemailer';

export async function sendCustomerDeliveryFeedbackEmail(input: {
  to: string;
  orderNumber: string;
  customerName: string;
  feedbackUrl: string;
}): Promise<string> {
  const username = process.env.GMAIL_SMTP_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!username || !appPassword) {
    throw new Error('Gmail email is not configured. Set GMAIL_SMTP_USER and GMAIL_APP_PASSWORD on the server.');
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: username, pass: appPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const orderNumber = escapeHtml(input.orderNumber);
  const customerName = escapeHtml(input.customerName);
  try {
    const info = await transport.sendMail({
      from: { name: 'NMD Logistics', address: username },
      to: input.to,
      subject: `Your NMD Logistics delivery ${input.orderNumber} is complete`,
      text: `Hello ${input.customerName},\n\nYour delivery ${input.orderNumber} has been completed. Please share your experience: ${input.feedbackUrl}\n\nThis private feedback link expires in 30 days and can be used once.\n\nThank you,\nNMD Logistics`,
      html: `<p>Hello ${customerName},</p><p>Your delivery <strong>${orderNumber}</strong> has been completed.</p><p><a href="${input.feedbackUrl}">Share your delivery experience</a></p><p>This private feedback link expires in 30 days and can be used once.</p><p>Thank you,<br>NMD Logistics</p>`,
    });
    return info.messageId;
  } finally {
    transport.close();
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
