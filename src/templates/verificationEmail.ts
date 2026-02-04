export const verificationEmailTemplate = (name: string, verificationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
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
          background-color: #3498db;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 600;
        }
        .button:hover {
          background-color: #2980b9;
        }
        .expiry-notice {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
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
        .link-text {
          word-break: break-all;
          color: #3498db;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome, ${name}!</h1>
        <p>Thank you for registering with KACT. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        <div class="expiry-notice">
          <strong>⏰ Important:</strong> This verification link will expire in <strong>24 hours</strong> for security reasons.
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p class="link-text">${verificationUrl}</p>
        <p style="margin-top: 30px;">If you didn't create an account with us, please ignore this email or contact support if you have concerns.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} KACT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const verificationEmailText = (name: string, verificationUrl: string): string => {
  return `
Welcome, ${name}!

Thank you for registering with KACT. To complete your registration and activate your account, please verify your email address by visiting the following link:

${verificationUrl}

⏰ IMPORTANT: This verification link will expire in 24 hours for security reasons.

If you didn't create an account with us, please ignore this email.

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
