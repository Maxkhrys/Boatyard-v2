import type { APIRoute } from 'astro';

export const prerender = false;

const FRIENDLY_ERROR =
  'The tide took that one — give it another go in a moment.';

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  try {
    const data = (await request.json()) as { email?: string };
    email = String(data.email ?? '').trim();
  } catch {
    // fall through to validation below
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, message: 'That email doesn\'t look quite right — mind checking it?' }, 400);
  }

  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error('BUTTONDOWN_API_KEY is not set');
    return json({ ok: false, message: FRIENDLY_ERROR }, 500);
  }

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // `email_address` is the current field name; `email` keeps older
      // API versions happy too.
      body: JSON.stringify({ email_address: email, email }),
    });

    if (response.ok) {
      return json({ ok: true }, 200);
    }

    // Already on the list — that\'s a success as far as the visitor cares.
    const detail = await response.text();
    if (response.status === 400 && /already|exists/i.test(detail)) {
      return json({ ok: true }, 200);
    }

    console.error(`Buttondown responded ${response.status}: ${detail}`);
    return json({ ok: false, message: FRIENDLY_ERROR }, 502);
  } catch (error) {
    console.error('Buttondown request failed', error);
    return json({ ok: false, message: FRIENDLY_ERROR }, 502);
  }
};
