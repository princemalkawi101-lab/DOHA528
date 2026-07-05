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

  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

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
    return res.status(502).json({ error: 'PayPal authentication failed' });
  }
  const { access_token } = await tokenRes.json();

  const captureRes = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (!captureRes.ok) {
    const err = await captureRes.json();
    return res.status(502).json({ error: err.message || 'Capture failed', detail: err });
  }
  const result = await captureRes.json();

  const captureStatus = result.status;
  const captureId = result.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  const amount = result.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;

  return res.status(200).json({ captureStatus, orderId, captureId, amount });
};
