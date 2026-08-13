// TEMPORAL — registra el webhook de Stripe desde el servidor (que sí ve la key) y se borra después
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-setup-7c31d9') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const existing = await stripe.webhookEndpoints.list({ limit: 20 });
    const url = 'https://shams-jewellery.vercel.app/api/stripe-webhook';
    const found = existing.data.find(w => w.url === url);
    if (found) {
      return res.status(200).json({ id: found.id, note: 'already exists (secret solo visible al crear)' });
    }
    const wh = await stripe.webhookEndpoints.create({
      url,
      enabled_events: ['checkout.session.completed'],
    });
    return res.status(200).json({ id: wh.id, secret: wh.secret });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
