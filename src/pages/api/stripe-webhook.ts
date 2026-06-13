import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { buildVoucherEmail, generateVoucherCode } from '../../lib/vouchers';

export const prerender = false;

/**
 * Stripe webhook. On a completed checkout it generates a voucher code
 * and emails it to the recipient (or buyer), copying the business.
 * Configure the endpoint in Stripe to send `checkout.session.completed`.
 */
export const POST: APIRoute = async ({ request }) => {
  const secretKey = import.meta.env.STRIPE_SECRET_KEY;
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!secretKey || !webhookSecret) {
    console.error('Stripe keys are not set');
    return new Response('Webhook not configured', { status: 500 });
  }
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  // Raw body is required for signature verification.
  const rawBody = await request.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe signature verification failed', error);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('Ignored', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata ?? {};
  const amount = Number(meta.voucher_amount ?? session.amount_total ?? 0);
  // Derive code from the payment intent ID — unique per payment, idempotent on retries.
  const seed = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;
  const code = generateVoucherCode(seed);

  const buyerEmail = session.customer_details?.email ?? undefined;
  const recipientEmail = meta.recipient_email || undefined;

  // Always log the issued voucher so it exists in the deployment logs
  // even if email delivery is misconfigured.
  console.log(
    `Voucher issued: ${code} | ${meta.voucher_description ?? 'voucher'} | ${amount} | buyer=${
      buyerEmail ?? 'n/a'
    } | recipient=${recipientEmail ?? 'n/a'}`,
  );

  const { subject, html } = buildVoucherEmail({
    code,
    description: meta.voucher_description ?? 'Gift voucher',
    amount,
    recipientName: meta.recipient_name || undefined,
    buyerName: meta.buyer_name || undefined,
    message: meta.gift_message || undefined,
  });

  const resendKey = import.meta.env.RESEND_API_KEY;
  const fromEmail =
    import.meta.env.VOUCHER_FROM_EMAIL ?? 'The Boat Yard Sauna <onboarding@resend.dev>';
  const notifyEmail = import.meta.env.VOUCHER_NOTIFY_EMAIL ?? 'theboatyardsauna@gmail.com';

  const to = recipientEmail || buyerEmail || notifyEmail;
  const cc =
    recipientEmail && buyerEmail && recipientEmail !== buyerEmail ? [buyerEmail] : undefined;

  if (!resendKey) {
    console.error('RESEND_API_KEY is not set — voucher email not sent');
    return new Response('Received (email skipped)', { status: 200 });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        ...(cc && { cc }),
        bcc: [notifyEmail],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error(`Resend responded ${response.status}: ${await response.text()}`);
      // 200 anyway so Stripe does not retry indefinitely; the issue is
      // logged above with the voucher code for manual follow-up.
      return new Response('Received (email failed)', { status: 200 });
    }
  } catch (error) {
    console.error('Voucher email request failed', error);
    return new Response('Received (email failed)', { status: 200 });
  }

  return new Response('Received', { status: 200 });
};
