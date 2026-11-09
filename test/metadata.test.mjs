import test from 'node:test';
import assert from 'node:assert/strict';
import { metadataHash, normalizeMetadata, validateMetadata } from '../src/metadata.mjs';
const m = { productId: 'demo-001', name: 'Cafe\u0301  Watch', brand: 'Origin', category: 'Accessories', batch: 'B-1', manufacturerName: 'Maker' };
test('normalizes NFC, whitespace and ID case deterministically', () => { const a = normalizeMetadata(m); assert.equal(a.name, 'Café Watch'); assert.equal(a.productId, 'DEMO-001'); assert.equal(metadataHash(m), metadataHash({ ...m, productId: ' DEMO-001 ', name: ' Café\tWatch ' })); });
test('field order is fixed and meaningful changes alter the hash', () => { assert.equal(metadataHash(m), metadataHash(Object.fromEntries(Object.entries(m).reverse()))); assert.notEqual(metadataHash(m), metadataHash({ ...m, batch: 'B-2' })); });
test('validates IDs and UTF-8 byte limits', () => { assert.equal(validateMetadata(m).productId, 'DEMO-001'); assert.throws(() => validateMetadata({ ...m, productId: 'bad/id' })); assert.throws(() => validateMetadata({ ...m, brand: ' ' })); assert.throws(() => validateMetadata({ ...m, brand: 'é'.repeat(81) })); });
