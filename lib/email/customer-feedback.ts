import nodemailer from 'nodemailer';

function createGmailTransport() {
  const username = process.env.GMAIL_SMTP_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!username || !appPassword) {
    throw new Error('Gmail email is not configured. Set GMAIL_SMTP_USER and GMAIL_APP_PASSWORD on the server.');
  }

  return {
    username,
    transport: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: username, pass: appPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }),
  };
}

export async function sendCustomerDeliveryFeedbackEmail(input: {
  to: string;
  orderNumber: string;
  customerName: string;
  feedbackUrl: string;
  trackingUrl?: string;
}): Promise<string> {
  const { username, transport } = createGmailTransport();
  const orderNumber = escapeHtml(input.orderNumber);
  const customerName = escapeHtml(input.customerName);
  try {
    const info = await transport.sendMail({
      from: { name: 'NMD Logistics', address: username },
      to: input.to,
      subject: `Your NMD Logistics delivery ${input.orderNumber} is complete`,
      text: `Hello ${input.customerName},\n\nYour delivery ${input.orderNumber} has been completed. Please share your experience: ${input.feedbackUrl}${input.trackingUrl ? `\n\nView delivery details: ${input.trackingUrl}` : ''}\n\nThis private feedback link expires in 30 days and can be used once.\n\nThank you,\nNMD Logistics`,
      html: `<p>Hello ${customerName},</p><p>Your delivery <strong>${orderNumber}</strong> has been completed.</p><p><a href="${input.feedbackUrl}">Share your delivery experience</a></p>${input.trackingUrl ? `<p><a href="${input.trackingUrl}">View delivery details</a></p>` : ''}<p>This private feedback link expires in 30 days and can be used once.</p><p>Thank you,<br>NMD Logistics</p>`,
    });
    return info.messageId;
  } finally {
    transport.close();
  }
}

export async function sendCustomerTrackingEmail(input: {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingUrl: string;
}): Promise<string> {
  const { username, transport } = createGmailTransport();
  const orderNumber = escapeHtml(input.orderNumber);
  const customerName = escapeHtml(input.customerName);
  try {
    const info = await transport.sendMail({
      from: { name: 'NMD Logistics', address: username },
      to: input.to,
      subject: `Track your NMD Logistics order ${input.orderNumber}`,
      text: `Hello ${input.customerName},\n\nYou can check the delivery progress for order ${input.orderNumber} here:\n${input.trackingUrl}\n\nThis private tracking link expires in 30 days. It shows delivery milestones only and does not display your address or driver details.\n\nThank you,\nNMD Logistics`,
      html: `<p>Hello ${customerName},</p><p>You can check the delivery progress for order <strong>${orderNumber}</strong> here:</p><p><a href="${input.trackingUrl}">Track your delivery</a></p><p>This private tracking link expires in 30 days. It shows delivery milestones only and does not display your address or driver details.</p><p>Thank you,<br>NMD Logistics</p>`,
    });
    return info.messageId;
  } finally {
    transport.close();
  }
}

export async function sendCustomerTrackingUpdateEmail(input: {
  to: string;
  orderNumber: string;
  customerName: string;
  event: 'assigned' | 'in_transit' | 'delivery_failed';
  trackingUrl: string;
}): Promise<string> {
  const { username, transport } = createGmailTransport();
  const orderNumber = escapeHtml(input.orderNumber);
  const customerName = escapeHtml(input.customerName);
  const update = input.event === 'assigned'
    ? {
        subject: `A driver has been assigned to order ${input.orderNumber}`,
        text: `A driver has been assigned to your NMD Logistics order ${input.orderNumber}. Follow its progress here: ${input.trackingUrl}`,
        html: `<p>A driver has been assigned to your NMD Logistics order <strong>${orderNumber}</strong>.</p><p><a href="${input.trackingUrl}">Track your delivery</a></p>`,
      }
    : input.event === 'in_transit'
      ? {
          subject: `Your NMD Logistics order ${input.orderNumber} is on the way`,
          text: `Your NMD Logistics order ${input.orderNumber} is on the way. Follow its progress here: ${input.trackingUrl}`,
          html: `<p>Your NMD Logistics order <strong>${orderNumber}</strong> is on the way.</p><p><a href="${input.trackingUrl}">Track your delivery</a></p>`,
      }
      : {
        subject: `Delivery update for your NMD Logistics order ${input.orderNumber}`,
        text: `We could not complete the delivery for your NMD Logistics order ${input.orderNumber}. Follow its progress or contact the delivery team here: ${input.trackingUrl}`,
        html: `<p>We could not complete the delivery for your NMD Logistics order <strong>${orderNumber}</strong>.</p><p>Our delivery team will review the issue. <a href="${input.trackingUrl}">Check delivery status</a></p>`,
      };

  try {
    const info = await transport.sendMail({
      from: { name: 'NMD Logistics', address: username },
      to: input.to,
      subject: update.subject,
      text: `Hello ${input.customerName},\n\n${update.text}\n\nThank you,\nNMD Logistics`,
      html: `<p>Hello ${customerName},</p>${update.html}<p>Thank you,<br>NMD Logistics</p>`,
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
