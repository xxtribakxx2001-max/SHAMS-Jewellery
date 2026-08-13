// TEMPORAL — crea SHAMS15 (15%) y desactiva SHAMS10; se borra después
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.token !== 'shams-promo15-8b3f7d') {
    return res.status(403).json({ error: 'forbidden' });
  }
  try {
    const result = {};
    // Desactivar SHAMS10
    const old = await stripe.promotionCodes.list({ code: 'SHAMS10', limit: 1 });
    if (old.data.length > 0 && old.data[0].active) {
      await stripe.promotionCodes.update(old.data[0].id, { active: false });
      result.shams10 = 'desactivado';
    }
    // Crear SHAMS15
    const existing = await stripe.promotionCodes.list({ code: 'SHAMS15', limit: 1 });
    if (existing.data.length > 0) {
      result.shams15 = { id: existing.data[0].id, existing: true };
    } else {
      const coupon = await stripe.coupons.create({
        percent_off: 15,
        duration: 'once',
        name: 'SHAMS15 — 15% próxima compra',
      });
      const promo = await stripe.promotionCodes.create({ coupon: coupon.id, code: 'SHAMS15' });
      result.shams15 = { coupon: coupon.id, promo: promo.id, code: promo.code };
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
