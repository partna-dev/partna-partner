const STORAGE_KEY = "partna_partner_token";

export function readLinkToken(hash: string): string {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return (params.get("t") ?? "").trim();
}

export function takeToken(): string {
  const fromHash = readLinkToken(window.location.hash);
  if (fromHash) {
    sessionStorage.setItem(STORAGE_KEY, fromHash);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return fromHash;
  }
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function keepToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(STORAGE_KEY, token);
  }
}

export function forgetToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
