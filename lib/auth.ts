import bcrypt from "bcryptjs";

// Firma tokens de sesión de usuario con Web Crypto (compatible con Edge
// Runtime, igual que lib/session.ts para /ceo). El "payload" aquí es el
// userId en vez de un valor fijo, para poder identificar quién es quién.

const encoder = new TextEncoder();

function getSecret(): string {
  return process.env.USER_SESSION_SECRET || "dev-secret-cambia-esto";
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

export async function createUserToken(userId: string): Promise<string> {
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(userId));
  return `${userId}.${toHex(sig)}`;
}

export async function verifyUserToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;

  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const key = await getKey(getSecret());
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(userId));

  if (!timingSafeEqual(sig, toHex(expected))) return null;
  return userId;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
