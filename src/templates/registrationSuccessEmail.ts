export const registrationSuccessEmailTemplate = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Successful</title>
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
        .reminder-notice {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
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
        <h1>Registration Successful!</h1>
        <p>Hi ${name},</p>
        <p>Congratulations! Your KACT account has been successfully created.</p>
        <div class="reminder-notice">
          <strong>📧 Next Step:</strong> Please check your inbox for a separate <strong>verification email</strong> and click the link to activate your account. The verification link expires in <strong>24 hours</strong>.
        </div>
        <p>Once your email is verified, you'll have full access to all KACT features including events, memberships, and more.</p>
        <p>If you don't see the verification email, please check your spam or junk folder.</p>
        <p style="margin-top: 30px;">Welcome aboard!<br>The KACT Team</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} KACT. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

export const registrationSuccessEmailText = (name: string): string => {
  return `
Registration Successful!

Hi ${name},

Congratulations! Your KACT account has been successfully created.

📧 NEXT STEP: Please check your inbox for a separate verification email and click the link to activate your account. The verification link expires in 24 hours.

Once your email is verified, you'll have full access to all KACT features including events, memberships, and more.

If you don't see the verification email, please check your spam or junk folder.

Welcome aboard!
The KACT Team

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
