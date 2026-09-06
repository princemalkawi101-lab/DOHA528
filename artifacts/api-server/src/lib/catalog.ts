export type CatalogItem = {
  id: string;
  kind: string;
  titleAr: string;
  titleEn: string;
  priceJod: number;
  active: boolean;
  variant: "standard" | "vip";
};

type FirestoreValue = { stringValue?: string; doubleValue?: number; integerValue?: string; booleanValue?: boolean; nullValue?: null };
type FirestoreDocument = { name?: string; fields?: Record<string, FirestoreValue> };

function stringField(fields: Record<string, FirestoreValue>, key: string): string {
  return fields[key]?.stringValue ?? "";
}

function numberField(fields: Record<string, FirestoreValue>, key: string): number | null {
  const value = fields[key];
  const parsed = value?.doubleValue ?? (value?.integerValue == null ? NaN : Number(value.integerValue));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getCatalogItem(id: string, variant: "standard" | "vip" = "standard"): Promise<CatalogItem | null> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) throw new Error("Firebase catalog configuration is missing");
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/items/${encodeURIComponent(id)}?key=${encodeURIComponent(apiKey)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Catalog lookup failed (${response.status})`);
  const document = await response.json() as FirestoreDocument;
  const fields = document.fields ?? {};
  const discount = numberField(fields, "discountPriceJod");
  const original = numberField(fields, "originalPriceJod");
  const vip = numberField(fields, "vipPriceJod");
  const vipEnabled = fields.vipEnabled?.booleanValue === true;
  if (original == null || original < 0) return null;
  if (variant === "vip" && (!vipEnabled || vip == null || vip <= 0)) return null;
  return {
    id: variant === "vip" ? `${id}:vip` : id,
    kind: stringField(fields, "kind"),
    titleAr: stringField(fields, "titleAr") + (variant === "vip" ? " (VIP)" : ""),
    titleEn: stringField(fields, "titleEn") + (variant === "vip" ? " (VIP)" : ""),
    priceJod: variant === "vip" ? vip! : (discount != null && discount > 0 ? discount : original),
    active: fields.active?.booleanValue !== false,
    variant,
  };
}