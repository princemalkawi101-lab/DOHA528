// TEMPORARY: restore CURRENT_EVENT_PRICING_VERSION to "standard" after testing.
export const CURRENT_EVENT_PRICING_VERSION = "temporary-test-070";
const PRICES = {
  standard: { online: 30, vip: 49 },
  "temporary-test-070": { online: 0.70, vip: 0.70 },
} as const;
export const CURRENT_EVENT_PRICES = PRICES[CURRENT_EVENT_PRICING_VERSION];
// Keep historical order prices verifiable when prices change back.
export function expectedEventPrice(tier: string, version?: string): number | null {
  if (tier !== "online" && tier !== "vip") return null;
  if (version === undefined || version === "standard") return PRICES.standard[tier];
  if (version === "temporary-test-070") return PRICES[version][tier];
  return null;
}
