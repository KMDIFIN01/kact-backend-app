export const broadcastEmailTemplate = (subject: string, body: string): string => {
  const bodyHtml = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

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
        .header p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .greeting {
          font-size: 15px;
          color: #374151;
          margin-bottom: 16px;
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
        .unsubscribe {
          margin-top: 8px;
          font-size: 11px;
          color: #9ca3af;
        }
        .unsubscribe a {
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>An announcement from KACT (Kerala Association of Connecticut)</p>
        </div>
        <p class="greeting">Dear KACT Community Member,</p>
        <div class="body-content">
          ${bodyHtml}
        </div>
        <div class="footer">
          <p>Kerala Association of Connecticut (KACT) &mdash; <a href="https://kactusa.org">kactusa.org</a></p>
          <p class="unsubscribe">
            You are receiving this email as a registered member of the KACT community.<br/>
            <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a> from future community emails.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const broadcastEmailText = (body: string): string =>
  `Dear KACT Community Member,\n\n${body}\n\n---\nKerala Association of Connecticut (KACT)\nhttps://kactusa.org\n\nTo unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`;
