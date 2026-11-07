type ServiceAccountJson = {
  type: "service_account";
  project_id: string;
  client_email: string;
  private_key: string;
};

// Do not log the input or propagate JSON.parse's error: its message can include
// part of the private key. Accept only lossless formatting normalization.
export function parseEventCredentials(raw: string): ServiceAccountJson {
  let value: unknown;
  try {
    value = JSON.parse(raw.trim());
    // Some environment-variable editors store JSON as a JSON-encoded string.
    // Decode at most once; never guess missing punctuation or key contents.
    if (typeof value === "string") value = JSON.parse(value.trim());
  } catch {
    throw new Error("Firebase server credentials must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Firebase server credentials must be a service account object.");
  }
  const account = value as Record<string, unknown>;
  if (account.type !== "service_account"
    || typeof account.project_id !== "string" || !account.project_id.trim()
    || typeof account.client_email !== "string" || !account.client_email.trim()
    || typeof account.private_key !== "string" || !account.private_key.trim()) {
    throw new Error("Firebase server credentials must be a service account object.");
  }
  return {
    type: "service_account",
    project_id: account.project_id,
    client_email: account.client_email,
    private_key: account.private_key,
  };
}
