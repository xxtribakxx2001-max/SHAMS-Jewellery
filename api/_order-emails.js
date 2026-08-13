// SHAMS — Envío de emails de pedido (aviso a Simo + confirmación al cliente)
const nodemailer = require('nodemailer');

const GOLD = '#C9A84C';

function buildTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ORDER_EMAIL_USER,
      pass: process.env.ORDER_EMAIL_PASS,
    },
  });
}

function formatItems(items) {
  return items
    .map(i => `<tr><td style="padding:6px 12px 6px 0;">${i.name}</td><td style="padding:6px 12px;">x${i.qty || 1}</td><td style="padding:6px 0;text-align:right;">${(i.price || 0).toFixed(2)} €</td></tr>`)
    .join('');
}

function formatAddress(addr) {
  if (!addr) return '—';
  const a = addr.address || addr;
  return [addr.name, a.line1, a.line2, `${a.postal_code || ''} ${a.city || ''}`, a.country]
    .filter(Boolean)
    .join(', ');
}

function wrap(title, inner) {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#1a1a1a;color:#f5f0e8;padding:32px;">
    <h1 style="color:${GOLD};font-size:24px;letter-spacing:4px;text-align:center;margin:0 0 4px;">SHAMS</h1>
    <p style="text-align:center;color:#999;font-size:12px;margin:0 0 24px;">El oro del sol</p>
    <h2 style="font-size:18px;color:${GOLD};">${title}</h2>
    ${inner}
  </div>`;
}

async function sendOrderEmails({ orderId, customerName, customerEmail, shippingAddress, items, total }) {
  const transport = buildTransport();
  const from = `"SHAMS Jewels" <${process.env.ORDER_EMAIL_USER}>`;
  const itemsTable = `<table style="width:100%;border-collapse:collapse;color:#f5f0e8;">${formatItems(items)}</table>
    <p style="border-top:1px solid ${GOLD};padding-top:12px;text-align:right;font-size:16px;"><strong>Total: ${total.toFixed(2)} €</strong> · Envío incluido</p>`;

  const results = { owner: null, customer: null };

  // 1) Aviso al dueño — si falla, se propaga (Stripe reintenta)
  await transport.sendMail({
    from,
    to: process.env.ORDER_NOTIFY_TO,
    subject: `🛍️ Nuevo pedido SHAMS — ${customerName || 'cliente'} (${total.toFixed(2)} €)`,
    html: wrap('Nuevo pedido recibido', `
      <p><strong>Cliente:</strong> ${customerName || '—'}<br>
      <strong>Email:</strong> ${customerEmail || '—'}<br>
      <strong>Envío:</strong> ${formatAddress(shippingAddress)}</p>
      ${itemsTable}
      <p style="color:#999;font-size:12px;">Ref. Stripe: ${orderId}</p>`),
  });
  results.owner = 'sent';

  // 2) Confirmación al cliente — best effort (no bloquea el pedido)
  if (customerEmail) {
    try {
      await transport.sendMail({
        from,
        to: customerEmail,
        subject: 'Confirmación de tu pedido — SHAMS Jewels ✦',
        html: wrap('¡Gracias por tu compra!', `
          <p>Hola ${customerName || ''},</p>
          <p><strong>Gracias por tu compra y por confiar en SHAMS.</strong> Hemos recibido tu pedido y ya lo estamos preparando. <strong style="color:${GOLD};">En las próximas horas te enviaremos el código de seguimiento de tu envío</strong> a este mismo correo. Dirección de entrega:</p>
          <p style="color:#ccc;">${formatAddress(shippingAddress)}</p>
          ${itemsTable}
          <div style="border:1px solid ${GOLD};padding:16px;text-align:center;margin:20px 0;">
            <p style="margin:0 0 6px;color:#ccc;">Un regalo por confiar en nosotros ✦</p>
            <p style="margin:0;font-size:20px;letter-spacing:3px;color:${GOLD};"><strong>SHAMS10</strong></p>
            <p style="margin:6px 0 0;color:#999;font-size:12px;">10% de descuento en tu próxima compra</p>
          </div>
          <p style="color:#999;font-size:12px;">¿Dudas? Responde a este email.<br>shams-jewels.com</p>`),
      });
      results.customer = 'sent';
    } catch (error) {
      console.error('Customer email failed:', error.message);
      results.customer = `failed: ${error.message}`;
    }
  }

  return results;
}

module.exports = { sendOrderEmails };
