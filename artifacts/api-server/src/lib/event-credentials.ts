type ServiceAccountJson = {
  type: "service_account";
  project_id: string;
  client_email: string;
  private_key: string;
};

function invalidJson(error: unknown): Error {
  // Inspect the parser category only. Never retain its original message/cause:
  // JSON.parse errors may quote the sensitive input.
  const message = error instanceof SyntaxError ? error.message : "";
  const reason = message.includes("control character") ? "CONTROL_CHARACTER"
    : /escaped character|Unicode escape|escape sequence/i.test(message) ? "ESCAPE"
    : /Unexpected end|Unterminated string/i.test(message) ? "INCOMPLETE"
    : message.includes("non-whitespace character after JSON") ? "TRAILING_DATA"
    : "SYNTAX";
  return Object.assign(new Error("Firebase server credentials must be valid JSON."), {
    code: `FIREBASE_CREDENTIALS_JSON_${reason}`,
  });
}

function escapePrivateKeyLineBreaks(text: string): string {
  // Find the top-level private_key string lexically, not with a global newline
  // replacement (which could corrupt JSON layout or other credential fields).
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" || text[i] === "[") depth++;
    else if (text[i] === "}" || text[i] === "]") depth--;
    else if (text[i] === '"') {
      const start = i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") i++;
        i++;
      }
      if (depth !== 1 || text.slice(start, i + 1) !== '"private_key"') continue;
      let valueStart = i + 1;
      while (/\s/.test(text[valueStart] ?? "") && valueStart < text.length) valueStart++;
      if (text[valueStart++] !== ":") continue;
      while (/\s/.test(text[valueStart] ?? "") && valueStart < text.length) valueStart++;
      if (text[valueStart] !== '"') continue;
      const contentStart = ++valueStart;
      while (valueStart < text.length && text[valueStart] !== '"') {
        if (text[valueStart] === "\\") valueStart++;
        valueStart++;
      }
      if (valueStart === text.length) return text;
      const content = text.slice(contentStart, valueStart);
      return text.slice(0, contentStart) + content.replace(/\r/g, "\\r").replace(/\n/g, "\\n") + text.slice(valueStart);
    }
  }
  return text;
}

function parseCredentialJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError) || !error.message.includes("control character")) throw error;
    const normalized = escapePrivateKeyLineBreaks(text);
    if (normalized === text) throw error;
    // Strict parsing and service-account validation still run afterward.
    return JSON.parse(normalized);
  }
}

// Do not log the input or propagate JSON.parse's error: its message can include
// part of the private key. Accept only lossless formatting normalization.
export function parseEventCredentials(raw: string): ServiceAccountJson {
  let value: unknown;
  try {
    value = parseCredentialJson(raw.trim());
    // Some environment-variable editors store JSON as a JSON-encoded string.
    // Decode at most once; never guess missing punctuation or key contents.
    if (typeof value === "string") value = parseCredentialJson(value.trim());
  } catch (error) {
    throw invalidJson(error);
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
