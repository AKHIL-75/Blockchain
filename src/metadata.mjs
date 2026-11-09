import { keccak256, toUtf8Bytes } from 'ethers';
export const fields = ['productId', 'name', 'brand', 'category', 'batch', 'manufacturerName'];
export const normalizeText = value => String(value).normalize('NFC').trim().replace(/\s+/gu, ' ');
export const normalizeId = value => normalizeText(value).toUpperCase();
export function normalizeMetadata(input) {
  return Object.fromEntries(fields.map(key => [key, key === 'productId' ? normalizeId(input[key]) : normalizeText(input[key])]));
}
export function metadataHash(input) {
  const m = normalizeMetadata(input);
  return keccak256(toUtf8Bytes(JSON.stringify(['product-registry:v1', ...fields.map(key => m[key])])));
}
export function validateMetadata(input) {
  const m = normalizeMetadata(input);
  if (!/^[A-Z0-9_-]{1,64}$/.test(m.productId)) throw Error('Product ID: use 1–64 letters, digits, hyphens or underscores.');
  for (const key of fields.slice(1)) if (!m[key] || toUtf8Bytes(m[key]).length > 160) throw Error(`${key} must contain 1–160 UTF-8 bytes.`);
  return m;
}
