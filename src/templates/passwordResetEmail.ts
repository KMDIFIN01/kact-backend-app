export const passwordResetEmailTemplate = (name: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
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
        .button {
          display: inline-block;
          padding: 14px 32px;
          background-color: #e74c3c;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 600;
        }
        .button:hover {
          background-color: #c0392b;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .security-notice {
          background-color: #f8d7da;
          border-left: 4px solid #dc3545;
          padding: 15px;
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
        .link-text {
          word-break: break-all;
          color: #e74c3c;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset the password for your KACT account. Click the button below to create a new password:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <div class="warning">
          <strong>⏰ Time-Sensitive:</strong> This password reset link will expire in <strong>30 minutes</strong> for your security.
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="link-text">${resetUrl}</p>
        <div class="security-notice">
          <strong>🔒 Security Notice:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Never share this link with anyone</li>
            <li>KACT will never ask for your password via email</li>
            <li>If you didn't request this reset, please ignore this email and consider changing your password</li>
          </ul>
        </div>
        <p style="margin-top: 30px;">If you didn't request a password reset, please ignore this email or contact our support team immediately if you have security concerns.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} KACT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const passwordResetEmailText = (name: string, resetUrl: string): string => {
  return `
Password Reset Request

Hi ${name},

We received a request to reset the password for your KACT account. Visit the following link to create a new password:

${resetUrl}

⏰ TIME-SENSITIVE: This password reset link will expire in 30 minutes for your security.

🔒 SECURITY NOTICE:
- Never share this link with anyone
- KACT will never ask for your password via email
- If you didn't request this reset, please ignore this email and consider changing your password

If you didn't request a password reset, please contact our support team immediately if you have security concerns.

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
