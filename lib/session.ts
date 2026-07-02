// Firma la cookie de sesión usando Web Crypto (SubtleCrypto), disponible
// tanto en el runtime de Node como en el Edge Runtime que usa el middleware
// de Next.js. node:crypto NO funciona dentro de middleware.ts — por eso
// esta versión evita importarlo.

const VALUE = "ceo";
const encoder = new TextEncoder();

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-cambia-esto";
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(VALUE));
  return `${VALUE}.${toHex(sig)}`;
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [value, sig] = token.split(".");
  if (!value || !sig || value !== VALUE) return false;

  const key = await getKey(getSecret());
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return timingSafeEqual(sig, toHex(expected));
}
