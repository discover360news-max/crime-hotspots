import type { APIRoute } from 'astro';

/**
 * POST /api/subscribe
 * Server-side Buttondown newsletter subscription.
 * BUTTONDOWN_API_KEY must be set in Cloudflare Pages environment variables.
 * For local dev, add it to astro-poc/.env: BUTTONDOWN_API_KEY=your_key_here
 */
export const POST: APIRoute = async ({ request }) => {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let email: string;
  let source: string;

  try {
    const body = await request.json();
    email = (body.email ?? '').trim();
    source = (body.source ?? 'website').trim();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error('[subscribe] BUTTONDOWN_API_KEY is not set');
    return json({ error: 'Service temporarily unavailable. Please try again later.' }, 503);
  }

  let bdResponse: Response;
  try {
    bdResponse = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: ['website', source],
        referrer_url: `https://crimehotspots.com/${source}`,
      }),
    });
  } catch {
    return json({ error: 'Network error. Please try again.' }, 500);
  }

  // 201 Created — new subscriber
  if (bdResponse.status === 201) {
    return json({ success: true });
  }

  // Parse Buttondown error body
  let bdBody: Record<string, unknown> = {};
  try {
    bdBody = await bdResponse.json();
  } catch {
    // ignore parse errors
  }

  // Buttondown returns 400 for duplicate emails and validation failures.
  // Treat duplicate as a soft success so users don't learn if an email is on the list.
  const bodyStr = JSON.stringify(bdBody).toLowerCase();
  if (
    bdResponse.status === 400 &&
    (bodyStr.includes('already') || bodyStr.includes('exists') || bodyStr.includes('duplicate'))
  ) {
    return json({ success: true, message: "You're already subscribed — check your inbox." });
  }

  if (bdResponse.status === 400) {
    return json({ error: 'Please check your email address and try again.' }, 400);
  }

  if (bdResponse.status === 401) {
    console.error('[subscribe] Buttondown auth failed — check BUTTONDOWN_API_KEY');
    return json({ error: 'Service temporarily unavailable.' }, 503);
  }

  // Unexpected error
  console.error('[subscribe] Unexpected Buttondown status:', bdResponse.status, bdBody);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
};
