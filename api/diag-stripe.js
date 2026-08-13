// TEMPORAL — diagnóstico: últimos eventos y sesiones de Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-diag-4f81c2') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 5 });
    const events = await stripe.events.list({ limit: 10, types: ['checkout.session.completed'] });
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    return res.status(200).json({
      sessions: sessions.data.map(s => ({
        id: s.id, status: s.status, payment_status: s.payment_status,
        amount_total: s.amount_total, created: new Date(s.created * 1000).toISOString(),
        email: s.customer_details && s.customer_details.email,
        metadata: s.metadata,
      })),
      completed_events: events.data.map(e => ({
        id: e.id, created: new Date(e.created * 1000).toISOString(),
        session: e.data.object.id,
      })),
      webhooks: webhooks.data.map(w => ({ id: w.id, url: w.url, status: w.status, events: w.enabled_events })),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
