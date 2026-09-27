/**
 * Tango — Opaque Collision-Safe Identifiers
 *
 * Governed by:
 * - docs/DATA_MODEL.md (§2.1 ID & Title Independence Rules)
 * - docs/CONTENT_LIBRARY_SPEC.md (§2.3)
 *
 * IDs are never derived from titles. `crypto.randomUUID()` is only available in secure contexts,
 * so a `crypto.getRandomValues()` based UUID v4 is used as a fallback (e.g. a phone opening the
 * dev server over a LAN address).
 */

function randomUuid(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Creates an opaque ID such as `book_2f1c…`. */
export function createId(prefix: 'book' | 'lesson' | 'item' | 'cover' | 'session'): string {
  return `${prefix}_${randomUuid()}`;
}
