// TEMPORAL — registra el webhook con la key de ESTE proyecto y se borra después
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-fix-9d24aa') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const url = 'https://shams-jewels.com/api/stripe-webhook';
    const list = await stripe.webhookEndpoints.list({ limit: 20 });
    const found = list.data.find(w => w.url === url);
    if (found) {
      return res.status(200).json({ id: found.id, existing: true });
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
