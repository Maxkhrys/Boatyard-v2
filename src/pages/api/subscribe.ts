import type { APIRoute } from 'astro';

// Runs as a serverless function so BUTTONDOWN_API_KEY never reaches the client.
export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;

  if (!apiKey) {
    console.error('[subscribe] BUTTONDOWN_API_KEY is not configured');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return json({ ok: false, error: 'invalid_request' }, 400);
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email, tags: ['website'] }),
    });

    if (response.ok) {
      return json({ ok: true });
    }

    // Buttondown returns 400 with a detail message for duplicates — treat
    // an already-subscribed address as success from the visitor's side.
    const detail = await response.text();
    if (response.status === 400 && /already.*subscribed|exists/i.test(detail)) {
      return json({ ok: true, alreadySubscribed: true });
    }

    console.error('[subscribe] Buttondown error', response.status, detail);
    return json({ ok: false, error: 'provider_error' }, 502);
  } catch (error) {
    console.error('[subscribe] request failed', error);
    return json({ ok: false, error: 'network_error' }, 502);
  }
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
