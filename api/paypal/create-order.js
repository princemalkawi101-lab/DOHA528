module.exports = async function createOrder(req, res) {
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

  const { cart } = req.body || {};
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid', code: 'INVALID_CART' });
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

    const total = cart.reduce((sum, item) => {
      const jod = Number(item && item.jod);
      const qty = Number(item && (item.qty || 1));
      return sum + (Number.isFinite(jod) && Number.isFinite(qty) ? jod * qty : 0);
    }, 0);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ error: 'Cart contains an invalid price or quantity', code: 'INVALID_CART' });
    }

    const usdTotal = (total * 1.41).toFixed(2);
    const description = cart
      .map((item) => item.titleEn || item.nameKey || 'Item')
      .join(', ')
      .slice(0, 127);

    const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: usdTotal }, description }],
      }),
    });
    const orderBody = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok || typeof orderBody.id !== 'string') {
      return res.status(502).json({
        error: orderBody.message || 'PayPal order creation failed',
        code: 'PAYPAL_CREATE_ORDER_FAILED',
        paypalErrorName: orderBody.name,
        debugId: orderBody.debug_id,
        details: orderBody.details,
      });
    }

    return res.status(200).json({ id: orderBody.id });
  } catch (error) {
    console.error('[PayPal] create-order function failed', error);
    return res.status(502).json({
      error: 'Unable to reach PayPal',
      code: 'PAYPAL_NETWORK_ERROR',
    });
  }
};