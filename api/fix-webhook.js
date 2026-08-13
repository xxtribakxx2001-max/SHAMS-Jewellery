// TEMPORAL — corrige la URL del webhook de Stripe y se borra después
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-fix-9d24aa') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const list = await stripe.webhookEndpoints.list({ limit: 20 });
    const results = [];
    for (const wh of list.data) {
      if (wh.url.includes('shams-jewellery.vercel.app')) {
        const updated = await stripe.webhookEndpoints.update(wh.id, {
          url: 'https://shams-jewels.com/api/stripe-webhook',
        });
        results.push({ id: updated.id, url: updated.url, status: updated.status });
      } else {
        results.push({ id: wh.id, url: wh.url, status: wh.status, untouched: true });
      }
    }
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
