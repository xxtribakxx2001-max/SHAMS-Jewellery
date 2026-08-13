// SHAMS Stripe Webhook — Descuenta stock y registra el pedido al completarse un pago
// Endpoint: /api/stripe-webhook

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function supabaseRequest(path, method, body) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${path} failed: ${response.status} ${text}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: `Webhook error: ${error.message}` });
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  try {
    const items = JSON.parse(session.metadata?.items_json || '[]');

    for (const item of items) {
      await supabaseRequest('rpc/decrement_stock', 'POST', {
        p_id: item.id,
        p_qty: item.qty || 1,
      });
    }

    await supabaseRequest('orders', 'POST', {
      stripe_session_id: session.id,
      customer_name: session.customer_details?.name || null,
      customer_email: session.customer_details?.email || null,
      shipping_address:
        session.collected_information?.shipping_details ||
        session.customer_details?.address ||
        null,
      items,
      total: (session.amount_total || 0) / 100,
    });

    console.log(`Order recorded: ${session.id}, ${items.length} item(s)`);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Order processing error:', error.message);
    // 500 => Stripe reintenta el webhook
    return res.status(500).json({ error: error.message });
  }
}
