import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { resolveSelection } from '../../lib/vouchers';

export const prerender = false;

const FRIENDLY_ERROR =
  'We could not start the checkout just now — please try again in a moment.';

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clip(value: unknown, max = 480): string {
  return String(value ?? '').trim().slice(0, max);
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }

  // Price the selection on the server — never trust the browser's amount.
  const selection = resolveSelection({
    type: clip(payload.type, 20),
    packageId: clip(payload.packageId, 40),
    amount: payload.amount as number | string | undefined,
  });

  if (!selection) {
    return json({ ok: false, message: 'Please choose a valid voucher option.' }, 400);
  }

  const secretKey = import.meta.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return json({ ok: false, message: FRIENDLY_ERROR }, 500);
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  const recipientEmail = clip(payload.recipientEmail, 120);
  const metadata: Record<string, string> = {
    voucher_description: selection.description,
    voucher_amount: String(selection.amount),
    recipient_name: clip(payload.recipientName, 120),
    recipient_email: recipientEmail,
    gift_message: clip(payload.giftMessage, 480),
    buyer_name: clip(payload.buyerName, 120),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Apple Pay, Google Pay and cards are offered automatically by
      // Stripe's hosted checkout based on the account's settings.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: selection.amount,
            product_data: {
              name: selection.description,
              description: 'The Boat Yard Sauna — Wicklow & Arklow',
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/vouchers/success`,
      cancel_url: `${origin}/vouchers?status=cancelled`,
    });

    if (!session.url) {
      return json({ ok: false, message: FRIENDLY_ERROR }, 502);
    }
    return json({ ok: true, url: session.url }, 200);
  } catch (error) {
    console.error('Stripe checkout session failed', error);
    return json({ ok: false, message: FRIENDLY_ERROR }, 502);
  }
};
