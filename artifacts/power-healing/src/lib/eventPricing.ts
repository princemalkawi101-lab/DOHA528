// TEMPORARY test prices. Restore online: 30 and vip: 49 after payment testing.
export const EVENT_PRICES = { online: 0.70, vip: 0.70 } as const;
export const onlinePrice = EVENT_PRICES.online.toFixed(2);
export const vipPrice = EVENT_PRICES.vip.toFixed(2);
