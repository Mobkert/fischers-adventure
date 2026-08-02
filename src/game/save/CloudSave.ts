/**
 * Password cloud saves via encrypted JSONBlob storage.
 * Same pattern as Blob Survivor: password → PBKDF2 → AES-GCM → shared index blob.
 */

import { SaveData, cloneSave } from "./SaveBank";

const INDEX_BLOB_ID = "aef0a103-8e96-11f1-bdf1-a3a5b336b14d";
const INDEX_URL = `https://jsonblob.iiif.arthistoricum.net/api/jsonBlob/${INDEX_BLOB_ID}`;
const PEPPER = "fischers-adventure-cloud-v1";
const PASSWORD_STORE_KEY = "fischers_adventure_cloud_passwords_v1";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveKey(
  password: string,
  saltBytes: Uint8Array
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${PEPPER}:${password}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes as BufferSource,
      iterations: 120000,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSlot(slotData: SaveData, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify(slotData));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return {
    v: 1,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ct)),
  };
}

async function decryptSlot(
  payload: { salt?: string; iv?: string; ct?: string },
  password: string
): Promise<SaveData> {
  if (!payload?.salt || !payload?.iv || !payload?.ct) {
    throw new Error("Corrupt cloud save");
  }
  const salt = b64ToBytes(payload.salt);
  const iv = b64ToBytes(payload.iv);
  const ct = b64ToBytes(payload.ct);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource
  );
  return cloneSave(JSON.parse(new TextDecoder().decode(plain)));
}

async function fetchIndex(): Promise<{
  v: number;
  game: string;
  map: Record<string, unknown>;
}> {
  let res: Response;
  try {
    res = await fetch(INDEX_URL, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Could not reach cloud saves (network error)");
  }
  if (!res.ok) {
    throw new Error(`Could not reach cloud saves (${res.status})`);
  }
  const data = await res.json();
  if (!data || typeof data !== "object") {
    return { v: 1, game: "fischers-adventure", map: {} };
  }
  if (!data.map || typeof data.map !== "object") data.map = {};
  return data;
}

async function putIndex(index: object): Promise<void> {
  let res: Response;
  try {
    res = await fetch(INDEX_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(index),
    });
  } catch {
    throw new Error("Could not write cloud save (network error)");
  }
  if (!res.ok) throw new Error(`Could not write cloud save (${res.status})`);
}

export function normalizePassword(raw: string): string {
  return String(raw || "").trim();
}

export function validatePassword(password: string): string | null {
  if (password.length < 4) return "Password must be at least 4 characters.";
  if (password.length > 64) return "Password is too long (max 64).";
  return null;
}

function loadPasswordMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORD_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePasswordMap(map: Record<string, string>): void {
  localStorage.setItem(PASSWORD_STORE_KEY, JSON.stringify(map));
}

export function rememberSlotPassword(slotIndex: number, password: string): void {
  const pw = normalizePassword(password);
  if (validatePassword(pw)) return;
  const map = loadPasswordMap();
  map[String(slotIndex)] = pw;
  savePasswordMap(map);
}

export function getRememberedSlotPassword(slotIndex: number): string {
  const map = loadPasswordMap();
  return normalizePassword(map[String(slotIndex)] || "");
}

export function clearRememberedSlotPassword(slotIndex: number): void {
  const map = loadPasswordMap();
  delete map[String(slotIndex)];
  savePasswordMap(map);
}

export async function cloudSaveSlot(
  slotData: SaveData,
  password: string
): Promise<boolean> {
  const pw = normalizePassword(password);
  const err = validatePassword(pw);
  if (err) throw new Error(err);

  const key = await sha256Hex(`${PEPPER}|${pw}`);
  const encrypted = await encryptSlot(cloneSave(slotData), pw);
  const index = await fetchIndex();
  index.map[key] = {
    ...encrypted,
    updatedAt: Date.now(),
  };
  await putIndex(index);
  return true;
}

export async function cloudLoadSlot(password: string): Promise<SaveData> {
  const pw = normalizePassword(password);
  const err = validatePassword(pw);
  if (err) throw new Error(err);

  const key = await sha256Hex(`${PEPPER}|${pw}`);
  const index = await fetchIndex();
  const entry = index.map?.[key] as
    | { salt?: string; iv?: string; ct?: string }
    | undefined;
  if (!entry) throw new Error("No cloud save found for that password.");
  return decryptSlot(entry, pw);
}
