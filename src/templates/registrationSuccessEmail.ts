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
        <p>Congratulations! Your email has been verified and your KACT account is now fully registered.</p>
        <div class="reminder-notice">
          <strong>✅ You're all set!</strong> Please <a href="https://www.kactusa.org/login" style="color: #3498db; font-weight: bold;">log in</a> to your account to access all KACT features including events, memberships, and more.
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
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

Congratulations! Your email has been verified and your KACT account is now fully registered.

✅ YOU'RE ALL SET! Please log in at https://www.kactusa.com/login to access all KACT features including events, memberships, and more.

If you have any questions, feel free to reach out to our support team.

Welcome aboard!
The KACT Team

© ${new Date().getFullYear()} KACT. All rights reserved.
  `.trim();
};
