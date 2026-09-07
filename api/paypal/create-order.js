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

    const normalizedCart = cart.map((item) => {
      const priceJod = Number(item && item.jod);
      const quantity = Number(item && (item.qty ?? 1));
      return { item, priceJod, quantity };
    });
    const hasInvalidItem = normalizedCart.some(({ priceJod, quantity }) =>
      !Number.isFinite(priceJod) ||
      priceJod <= 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    );
    if (hasInvalidItem) {
      return res.status(400).json({ error: 'Cart contains an invalid price or quantity', code: 'INVALID_CART' });
    }

    const paypalItems = normalizedCart.map(({ item, priceJod, quantity }) => ({
      name: String(item.titleEn || item.nameKey || 'Item').slice(0, 127),
      unit_amount: {
        currency_code: 'USD',
        value: Number(priceJod * 1.41).toFixed(2),
      },
      quantity: String(quantity),
    }));
    const usdTotal = paypalItems
      .reduce((sum, item) => sum + Number(item.unit_amount.value) * Number(item.quantity), 0)
      .toFixed(2);
    if (!Number.isFinite(Number(usdTotal)) || Number(usdTotal) <= 0) {
      return res.status(400).json({ error: 'Cart contains an invalid price or quantity', code: 'INVALID_CART' });
    }
    const description = normalizedCart
      .map(({ item }) => item.titleEn || item.nameKey || 'Item')
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
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: Number(usdTotal).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: Number(usdTotal).toFixed(2),
              },
            },
          },
          items: paypalItems,
          description,
        }],
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