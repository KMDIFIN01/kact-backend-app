interface ImageAttachment {
  url: string;
  filename: string;
}

export const announcementEmailTemplate = (
  subject: string,
  body: string,
  attachments: ImageAttachment[] = []
): string => {
  const bodyHtml = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const attachmentsHtml = attachments.length > 0
    ? `<div style="margin-top: 28px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
        ${attachments.map((a) => `
        <div style="margin-bottom: 20px;">
          <img src="${a.url}" alt="${a.filename}" style="max-width: 100%; border-radius: 8px; display: block; border: 1px solid #E5E7EB;" />
        </div>`).join('')}
      </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 2px solid #1a56db;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .header h1 {
          color: #1a56db;
          margin: 0;
          font-size: 22px;
        }
        .header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .body-content {
          font-size: 15px;
          color: #374151;
          line-height: 1.7;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>An announcement from KACT (Kerala Association of Connecticut)</p>
        </div>
        <div class="body-content">
          ${bodyHtml}
        </div>
        ${attachmentsHtml}
        <p style="margin-top: 30px; color: #6b7280;">Best regards,<br/>The KACT Team</p>
      </div>
      <div class="footer">
        <p>You are receiving this email because you are a registered member or user of KACT.</p>
        <p style="margin-top: 8px;">For any questions regarding these communications, please contact us at <a href="mailto:mykact@gmail.com" style="color: #1a56db;">mykact@gmail.com</a>. Kindly note that contact@kactusa.org is a send-only address used for official updates, and replies to that email will not be monitored.</p>
        <p>&copy; ${new Date().getFullYear()} KACT – Kerala Association of Connecticut. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const announcementEmailText = (_subject: string, body: string): string => {
  return `
${body}

---
Best regards,
The KACT Team

You are receiving this email because you are a registered member or user of KACT.

For any questions regarding these communications, please contact us at mykact@gmail.com. Kindly note that contact@kactusa.org is a send-only address used for official updates, and replies to that email will not be monitored.

© ${new Date().getFullYear()} KACT – Kerala Association of Connecticut. All rights reserved.
  `.trim();
};
