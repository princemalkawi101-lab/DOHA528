module.exports = async function captureOrder(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    return res.status(500).json({
      error: 'PayPal credentials are not configured on the server',
      code: 'PAYPAL_NOT_CONFIGURED',
    });
  }

  const { orderId } = req.body || {};
  if (typeof orderId !== 'string' || !/^[A-Z0-9-]{5,80}$/i.test(orderId)) {
    return res.status(400).json({
      error: 'orderId is required and must be a valid PayPal order id',
      code: 'INVALID_ORDER_ID',
    });
  }

  try {
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const tokenBody = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || typeof tokenBody.access_token !== 'string') {
      return res.status(502).json({
        error: tokenBody.error_description || tokenBody.message || 'PayPal authentication failed',
        code: 'PAYPAL_AUTHENTICATION_FAILED',
      });
    }

    const captureRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await captureRes.json().catch(() => ({}));
    if (!captureRes.ok) {
      return res.status(502).json({
        error: result.message || 'PayPal capture failed',
        code: 'PAYPAL_CAPTURE_ORDER_FAILED',
        paypalErrorName: result.name,
        debugId: result.debug_id,
        details: result.details,
      });
    }

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    return res.status(200).json({
      captureStatus: result.status,
      orderId,
      captureId: capture?.id,
      amount: capture?.amount?.value,
    });
  } catch (error) {
    console.error('[PayPal] capture-order function failed', error);
    return res.status(502).json({
      error: 'Unable to reach PayPal',
      code: 'PAYPAL_NETWORK_ERROR',
    });
  }
};