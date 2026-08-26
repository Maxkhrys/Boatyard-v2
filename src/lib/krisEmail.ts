/* ------------------------------------------------------------------
   Kris's private-session booking email address, and a one-off
   campaign email introducing his guided sauna sessions.
   He has a second address for private bookings too — add it here as
   KRIS_EMAIL_CC once we have it; the booking form only CCs it when set.
   ------------------------------------------------------------------ */

export const KRIS_EMAIL = 'krystoftheboatyardsauna@gmail.com';
export const KRIS_EMAIL_CC = ''; // TODO: add Kris's second address here when we have it

/* Not wired to any send pipeline — copy the HTML into Resend/Buttondown
   when ready to send. */
export function buildKrisEmail(): { subject: string; html: string } {
  const subject = 'Guided sauna sessions with Kris — book him privately';

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
      <h1 style="margin:0 0 24px;font-size:26px;color:#edf2f0;font-weight:600;">Meet Kris, your guided session host.</h1>

      <div style="background:#edf2f0;border-radius:12px;padding:28px 26px;color:#0b1d2e;">
        <p style="margin:0 0 16px;font-size:16px;">Hi,</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#33403f;">
          Kris runs our guided sauna sessions at Wicklow Harbour — heat, cold plunge, and breathwork,
          talked through and paced by someone who does this every day. It's the same Boatyard standard,
          with a host in the room to guide the rounds.
        </p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#33403f;">
          Group sessions run on the regular schedule — but if you want Kris for a private session,
          just for you or your group, you can book him directly.
        </p>

        <div style="margin:0 0 8px;padding:22px;border:2px solid #c8956c;border-radius:10px;text-align:center;background:#ffffff;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#a06b42;font-weight:700;">Book Kris privately</p>
          <a href="mailto:${KRIS_EMAIL}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#c8956c;color:#0b1d2e;font-size:15px;font-weight:700;text-decoration:none;">${KRIS_EMAIL}</a>
          <p style="margin:12px 0 0;font-size:13px;color:#5b6b73;">Email Kris directly to arrange a private guided session.</p>
        </div>
      </div>

      <div style="padding:24px 4px;color:#9fb0b8;font-size:13px;line-height:1.7;">
        <p style="margin:0 0 10px;">Prefer a regular group session? Book online same as always, at either harbour — Wicklow Town or Arklow.</p>
        <p style="margin:0 0 10px;">Any other questions, just reply to this email or contact us at <a href="mailto:theboatyardsauna@gmail.com" style="color:#c8956c;">theboatyardsauna@gmail.com</a>.</p>
        <p style="margin:18px 0 0;color:#5b6b73;">Cold sea. Hot sauna. Clear head.</p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
}
