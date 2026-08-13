// SHAMS Stripe Checkout — Create Payment Session
// Deploy: Vercel Serverless Function
// Endpoint: /api/create-checkout-session

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, locale } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    // Build line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.type,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: item.quantity || item.qty || 1,
    }));

    // Determine URLs based on deployment
    const baseUrl = req.headers.origin || 'https://shams-jewels.com';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/index.html`,
      locale: locale || 'es',
      shipping_address_collection: {
        allowed_countries: ['ES', 'GB', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE'],
      },
      billing_address_collection: 'required',
      metadata: {
        source: 'SHAMS-Jewellery',
        items_json: JSON.stringify(items.map(i => ({
          id: i.id,
          name: i.name,
          qty: i.qty,
          price: i.price
        }))),
      },
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
