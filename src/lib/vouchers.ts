import { randomInt, createHash } from 'node:crypto';

/* ------------------------------------------------------------------
   Gift voucher catalogue + helpers.
   Shared by the /vouchers page (catalogue, formatting) and the Stripe
   API routes (server-side validation, code generation, email HTML).
   All amounts are in euro cents.
   ------------------------------------------------------------------ */

export interface SessionPackage {
  id: string;
  label: string;
  amount: number; // cents
  blurb: string;
}

export const SESSION_PACKAGES: SessionPackage[] = [
  {
    id: 'single',
    label: 'Single Session',
    amount: 1200,
    blurb: 'One 45-minute session of heat, cold plunge, and sea air.',
  },
  {
    id: 'pack10',
    label: '10-Session Pack',
    amount: 11000,
    blurb: 'Ten sessions to build sauna into the week — save €10.',
  },
];

/** Preset open-value gift amounts (cents). */
export const GIFT_PRESETS = [2500, 5000, 10000];

/** Bounds for a custom gift amount (cents). */
export const CUSTOM_MIN = 1000; // €10
export const CUSTOM_MAX = 50000; // €500

export function formatEuro(cents: number): string {
  const euros = cents / 100;
  return Number.isInteger(euros) ? `€${euros}` : `€${euros.toFixed(2)}`;
}

export interface ResolvedSelection {
  description: string;
  amount: number; // cents
}

export interface SelectionInput {
  type?: string;
  packageId?: string;
  amount?: number | string;
}

/**
 * Validates a buyer's selection on the server. Never trust the amount
 * sent by the browser for a package — always price it from the catalogue.
 * Returns null when the selection is invalid.
 */
export function resolveSelection(input: SelectionInput): ResolvedSelection | null {
  if (input.type === 'package') {
    const pkg = SESSION_PACKAGES.find((p) => p.id === input.packageId);
    if (!pkg) return null;
    return { description: `${pkg.label} voucher`, amount: pkg.amount };
  }

  if (input.type === 'amount') {
    const cents = Math.round(Number(input.amount));
    if (!Number.isFinite(cents) || cents < CUSTOM_MIN || cents > CUSTOM_MAX) {
      return null;
    }
    return { description: `Gift voucher (${formatEuro(cents)})`, amount: cents };
  }

  return null;
}

/**
 * Generates a human-friendly BOAT-XXXX-XXXX voucher code.
 * Pass a seed (Stripe payment intent ID) for deterministic, guaranteed-unique codes.
 * The same seed always produces the same code, so webhook retries are idempotent.
 * Falls back to crypto random only if no seed is provided.
 */
export function generateVoucherCode(seed?: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  if (seed) {
    const hash = createHash('sha256').update(seed).digest();
    const block = (offset: number) =>
      Array.from({ length: 4 }, (_, i) => alphabet[hash[offset + i] % alphabet.length]).join('');
    return `BOAT-${block(0)}-${block(4)}`;
  }
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
  return `BOAT-${block()}-${block()}`;
}

export interface VoucherEmailInput {
  code: string;
  description: string;
  amount: number; // cents
  recipientName?: string;
  buyerName?: string;
  message?: string;
}

/** Builds the subject + HTML body for the voucher email. */
export function buildVoucherEmail(input: VoucherEmailInput): {
  subject: string;
  html: string;
} {
  const greeting = input.recipientName ? `Hi ${escapeHtml(input.recipientName)},` : 'Hello,';
  const fromLine = input.buyerName
    ? `<p style="margin:0 0 18px;color:#5b6b73;font-size:15px;">A gift from ${escapeHtml(
        input.buyerName,
      )}.</p>`
    : '';
  const messageBlock = input.message
    ? `<p style="margin:22px 0 0;padding:16px 18px;background:#f4f1ec;border-radius:8px;color:#33403f;font-size:15px;font-style:italic;">&ldquo;${escapeHtml(
        input.message,
      )}&rdquo;</p>`
    : '';

  const subject = `Your Boat Yard Sauna gift voucher — ${formatEuro(input.amount)}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#0b1d2e;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="margin-bottom:20px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" style="display:block;">
          <path d="M11.2 3v12h1.6V3z" fill="#c8956c"/>
          <path d="M10.6 4 5 14h5.6z" fill="#c8956c"/>
          <path d="M13.4 4v9.4H19z" fill="#c8956c"/>
          <path d="M4 16.6h16l-2.2 3.8H6.2z" fill="#c8956c"/>
        </svg>
      </div>
      <p style="margin:0 0 6px;letter-spacing:0.3em;text-transform:uppercase;font-size:11px;color:#c8956c;">The Boat Yard Sauna</p>
      <h1 style="margin:0 0 24px;font-size:26px;color:#edf2f0;font-weight:600;">A gift of heat, cold &amp; calm.</h1>

      <div style="background:#edf2f0;border-radius:12px;padding:28px 26px;color:#0b1d2e;">
        <p style="margin:0 0 18px;font-size:16px;">${greeting}</p>
        ${fromLine}
        <p style="margin:0 0 6px;font-size:15px;color:#5b6b73;">${escapeHtml(input.description)}</p>
        <p style="margin:0 0 22px;font-size:34px;font-weight:700;">${formatEuro(input.amount)}</p>

        <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#a06b42;">Your voucher code</p>
        <p style="margin:0;padding:16px;border:2px dashed #c8956c;border-radius:8px;text-align:center;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#0b1d2e;">${input.code}</p>
        ${messageBlock}
      </div>

      <div style="padding:24px 4px;color:#9fb0b8;font-size:13px;line-height:1.7;">
        <p style="margin:0 0 10px;">Redeeming is easy: bring this code with you and show it to staff when you check in, at either harbour — Wicklow Town or Arklow.</p>
        <p style="margin:0 0 10px;">Questions? Just reply to this email, or contact us at <a href="mailto:theboatyardsauna@gmail.com" style="color:#c8956c;">theboatyardsauna@gmail.com</a>.</p>
        <p style="margin:18px 0 0;color:#5b6b73;">Cold sea. Hot cedar. Clear head.</p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
