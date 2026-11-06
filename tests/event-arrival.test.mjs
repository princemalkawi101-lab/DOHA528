import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const { outputFiles } = await build({
  entryPoints: ['artifacts/power-healing/src/lib/eventArrival.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { searchEventRegistrations: search, arrivalDate } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);
const entries = [
  { id: 'event_REFERENCE-123', name: 'Test Guest', phone: '+962 (79) 123-4567', email: 'Guest@Example.test' },
  { id: 'legacy', name: 'ضحى أحمد', phone: '0790000000' },
];
test('staff can find a registration by reference, name, formatted phone or email', () => {
  for (const term of ['reference-123', ' test guest ', '962791234567', 'GUEST@example.TEST', '+962 (79)']) {
    assert.deepEqual(search(entries, term), [entries[0]], term);
  }
  assert.deepEqual(search(entries, 'ضحى'), [entries[1]]);
  assert.deepEqual(search(entries, 'unknown'), []);
  assert.deepEqual(search(entries, '  '), entries);
});
test('arrival display tolerates legacy records and supports realtime and API dates', () => {
  assert.equal(arrivalDate(entries[0]), null);
  assert.equal(arrivalDate({ arrivedAt: null }), null);
  assert.equal(arrivalDate({ arrivedAt: 'invalid' }), null);
  const iso = '2026-11-06T10:30:00.000Z';
  assert.equal(arrivalDate({ arrivedAt: iso }).toISOString(), iso);
  assert.equal(arrivalDate({ arrivedAt: { toDate: () => new Date(iso) } }).toISOString(), iso);
});
