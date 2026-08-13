// TEMPORAL — crea el código descuento SHAMS10 (10%) y se borra después
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-promo-2e67b1') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const existing = await stripe.promotionCodes.list({ code: 'SHAMS10', limit: 1 });
    if (existing.data.length > 0) {
      return res.status(200).json({ id: existing.data[0].id, existing: true });
    }
    const coupon = await stripe.coupons.create({
      percent_off: 10,
      duration: 'once',
      name: 'SHAMS10 — 10% próxima compra',
    });
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'SHAMS10',
    });
    return res.status(200).json({ coupon: coupon.id, promo: promo.id, code: promo.code });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
