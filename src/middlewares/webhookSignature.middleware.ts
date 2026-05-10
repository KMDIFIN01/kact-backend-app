import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from '@utils/errors';

/**
 * Verifies the Resend webhook HMAC-SHA256 signature.
 *
 * Resend sends a `svix-signature` header (same format as Svix webhooks) and
 * additionally the `svix-id` and `svix-timestamp` headers.
 * Signature format: "v1,<base64-hmac-sha256(svix-id + '.' + svix-timestamp + '.' + rawBody, secret)>"
 *
 * To use:
 *  1. Mount this middleware on the raw-body route BEFORE express.json().
 *  2. Set RESEND_WEBHOOK_SECRET in your .env (the signing secret from Resend dashboard).
 *
 * The middleware attaches the parsed body to req.body as a plain object
 * so downstream handlers can use it normally.
 */
export const verifyResendWebhookSignature = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET is not configured');
      throw new UnauthorizedError('Webhook secret not configured');
    }

    const svixId = req.headers['svix-id'] as string | undefined;
    const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
    const svixSignature = req.headers['svix-signature'] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[Webhook] Missing Svix signature headers');
      throw new UnauthorizedError('Missing webhook signature headers');
    }

    // Reject timestamps older than 5 minutes to prevent replay attacks
    const timestampMs = Number(svixTimestamp) * 1000;
    const fiveMinutesMs = 5 * 60 * 1000;
    if (Math.abs(Date.now() - timestampMs) > fiveMinutesMs) {
      console.warn('[Webhook] Stale timestamp rejected:', svixTimestamp);
      throw new UnauthorizedError('Webhook timestamp is too old');
    }

    // rawBody is populated by express.raw() mounted on the webhook route in app.ts
    const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? req.body;
    const rawBodyStr: string = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : String(rawBody);

    // Signed payload: "{svix-id}.{svix-timestamp}.{body}"
    const signedPayload = `${svixId}.${svixTimestamp}.${rawBodyStr}`;

    // Strip the "whsec_" prefix if present (Resend sometimes includes it)
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const expectedHmac = crypto
      .createHmac('sha256', secretBytes)
      .update(signedPayload)
      .digest('base64');

    // svix-signature may contain multiple space-separated "v1,<sig>" tokens
    const signatureTokens = svixSignature.split(' ');
    const isValid = signatureTokens.some((token) => {
      const parts = token.split(',');
      if (parts.length !== 2 || parts[0] !== 'v1') return false;
      return crypto.timingSafeEqual(
        Buffer.from(parts[1], 'base64'),
        Buffer.from(expectedHmac, 'base64')
      );
    });

    if (!isValid) {
      console.warn('[Webhook] Signature mismatch — request rejected');
      throw new UnauthorizedError('Invalid webhook signature');
    }

    // Parse the raw JSON body and replace req.body so controllers can use it directly
    try {
      req.body = JSON.parse(rawBodyStr);
    } catch {
      throw new UnauthorizedError('Invalid webhook payload encoding');
    }

    next();
  } catch (error) {
    next(error);
  }
};
