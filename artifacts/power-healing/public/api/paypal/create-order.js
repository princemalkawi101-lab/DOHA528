module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    return res.status(500).json({ error: 'PayPal credentials not configured on server' });
  }

  const { cart } = req.body || {};
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid' });
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return res.status(502).json({ error: 'PayPal authentication failed', detail: err });
  }
  const { access_token } = await tokenRes.json();

  const JOD_TO_USD = 1.41;
  const total = cart.reduce((sum, item) => sum + (Number(item.jod) * Number(item.qty || 1)), 0);
  const usdTotal = (total * JOD_TO_USD).toFixed(2);
  const description = cart
    .map((i) => i.titleEn || i.nameKey || 'Item')
    .join(', ')
    .slice(0, 127);

  const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: usdTotal },
          description,
        },
      ],
    }),
  });
  if (!orderRes.ok) {
    const err = await orderRes.json();
    return res.status(502).json({ error: err.message || 'Order creation failed', detail: err });
  }
  const order = await orderRes.json();
  return res.status(200).json({ id: order.id });
};
