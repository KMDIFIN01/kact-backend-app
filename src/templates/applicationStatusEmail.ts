export const applicationStatusEmailTemplate = (
  name: string,
  applicationType: 'membership' | 'sponsorship',
  status: 'APPROVED' | 'REJECTED'
): string => {
  const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';
  const isApproved = status === 'APPROVED';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${typeLabel} Application ${isApproved ? 'Approved' : 'Rejected'}</title>
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
        h1 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 24px;
        }
        .status-notice {
          background-color: ${isApproved ? '#d4edda' : '#f8d7da'};
          border-left: 4px solid ${isApproved ? '#28a745' : '#dc3545'};
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-notice {
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
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
        <h1>${typeLabel} Application ${isApproved ? 'Approved' : 'Rejected'}</h1>
        <p>Hi ${name},</p>
        ${isApproved ? `
        <div class="status-notice">
          <strong>✅ Congratulations!</strong> Your <strong>${typeLabel.toLowerCase()}</strong> application has been <strong>approved</strong> by the KACT administrator. Welcome to KACT!
        </div>
        <div class="info-notice">
          <strong>🔑 Website Access:</strong> If you have not yet created a user account, please <a href="https://www.kactusa.org/login" style="color: #3498db; font-weight: bold;">login or create an account</a> via our website <a href="https://www.kactusa.org" style="color: #3498db; font-weight: bold;">www.kactusa.org</a> to access all KACT features.
        </div>
        <p>Thank you for being a part of KACT!</p>
        ` : `
        <div class="status-notice">
          <strong>❌ Update:</strong> Unfortunately, your <strong>${typeLabel.toLowerCase()}</strong> application has been <strong>rejected</strong>. This may be due to incomplete payment or other reasons.
        </div>
        <p>If you believe this was an error or have questions, please feel free to reach out to our support team for further assistance.</p>
        `}
        <p style="margin-top: 30px;">Best regards,<br>The KACT Team</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} KACT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const applicationStatusEmailText = (
  name: string,
  applicationType: 'membership' | 'sponsorship',
  status: 'APPROVED' | 'REJECTED'
): string => {
  const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';
  const isApproved = status === 'APPROVED';

  if (isApproved) {
    return `
${typeLabel} Application Approved

Hi ${name},

✅ Congratulations! Your ${typeLabel.toLowerCase()} application has been approved by the KACT administrator. Welcome to KACT!

🔑 WEBSITE ACCESS: If you have not yet created a user account, please login or create an account via our website www.kactusa.org to access all KACT features.

Thank you for being a part of KACT!

Best regards,
The KACT Team

© ${new Date().getFullYear()} KACT. All rights reserved.
    `.trim();
  }

  return `
${typeLabel} Application Rejected

Hi ${name},

❌ Unfortunately, your ${typeLabel.toLowerCase()} application has been rejected. This may be due to incomplete payment or other reasons.

If you believe this was an error or have questions, please feel free to reach out to our support team for further assistance.

Best regards,
The KACT Team

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
