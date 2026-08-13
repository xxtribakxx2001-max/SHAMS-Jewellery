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
        subject: 'Su pedido SHAMS — Confirmación ✦',
        html: wrap('Bienvenido a SHAMS', `
          <p style="font-size:16px;">Estimado/a ${customerName || 'cliente'},</p>
          <p style="line-height:1.7;">Es un honor darle la bienvenida a <strong style="color:${GOLD};">SHAMS</strong>. Su pedido ha sido recibido y, desde este momento, nuestro equipo lo prepara con la dedicación que merece cada una de nuestras piezas.</p>
          <p style="line-height:1.7;">Cada joya SHAMS está inspirada en el oro del sol — creada para acompañarle en los momentos que importan. Confiamos en que la suya le haga sentir exactamente eso.</p>
          <p style="line-height:1.7;"><strong style="color:${GOLD};">En las próximas horas recibirá el código de seguimiento de su envío</strong> en este mismo correo.</p>
          <p style="color:#999;font-size:13px;margin-bottom:4px;">DIRECCIÓN DE ENTREGA</p>
          <p style="color:#ccc;margin-top:0;">${formatAddress(shippingAddress)}</p>
          <p style="color:#999;font-size:13px;margin-bottom:4px;">SU PEDIDO</p>
          ${itemsTable}
          <div style="border:1px solid ${GOLD};padding:20px;text-align:center;margin:24px 0;">
            <p style="margin:0 0 8px;color:#ccc;font-style:italic;">Una atención exclusiva, como agradecimiento por su confianza ✦</p>
            <p style="margin:0;font-size:22px;letter-spacing:4px;color:${GOLD};"><strong>SHAMS10</strong></p>
            <p style="margin:8px 0 0;color:#999;font-size:12px;">10% de descuento en su próxima adquisición</p>
          </div>
          <p style="line-height:1.7;">Gracias por elegirnos. Es un privilegio formar parte de su historia.</p>
          <p style="color:${GOLD};margin-bottom:0;">Atentamente,</p>
          <p style="margin-top:2px;">El equipo SHAMS</p>
          <p style="color:#999;font-size:12px;border-top:1px solid #333;padding-top:12px;">¿Alguna consulta? Responda a este correo — le atenderemos personalmente.<br>shams-jewels.com · El oro del sol</p>`),
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
