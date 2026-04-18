export const applicationSubmittedEmailTemplate = (name: string, applicationType: 'membership' | 'sponsorship'): string => {
  const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${typeLabel} Application Received</title>
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
        .warning-notice {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
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
        <h1>${typeLabel} Application Received</h1>
        <p>Hi ${name},</p>
        <p>Thank you for submitting your <strong>${typeLabel.toLowerCase()}</strong> application with KACT. We have received your application successfully.</p>
        <div class="warning-notice">
          <strong>⚠️ Important:</strong> Please note that submitting this application does <strong>not guarantee</strong> your ${typeLabel.toLowerCase()}. Your ${typeLabel.toLowerCase()} will only be confirmed once <strong>payment is completed</strong> and your application is <strong>approved by a KACT administrator</strong>.
        </div>
        <div class="info-notice">
          <strong>🔑 Website Access:</strong> To access the KACT website features, you need to <strong>register/login</strong> user account on the KACT website. You can do so by visiting <a href="https://www.kactusa.org/login" style="color: #3498db; font-weight: bold;">www.kactusa.org</a> and clicking on the Register/Login link.
        </div>
        <p>Our team will review your application and get back to you. If you have any questions in the meantime, feel free to reach out to our support team.</p>
        <p style="margin-top: 30px;">Thank you for your interest in KACT!<br>The KACT Team</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} KACT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const applicationSubmittedEmailText = (name: string, applicationType: 'membership' | 'sponsorship'): string => {
  const typeLabel = applicationType === 'membership' ? 'Membership' : 'Sponsorship';

  return `
${typeLabel} Application Received

Hi ${name},

Thank you for submitting your ${typeLabel.toLowerCase()} application with KACT. We have received your application successfully.

⚠️ IMPORTANT: Please note that submitting this application does not guarantee your ${typeLabel.toLowerCase()}. Your ${typeLabel.toLowerCase()} will only be confirmed once payment is completed and your application is approved by a KACT administrator.

🔑 WEBSITE ACCESS: To access the KACT website features, you need to register/login user account on the KACT website. You can do so by visiting https://www.kactusa.org/login and clicking on the Register/Login link.

Our team will review your application and get back to you. If you have any questions in the meantime, feel free to reach out to our support team.

Thank you for your interest in KACT!
The KACT Team

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
