import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('../artifacts/power-healing/src/lib/eventGuest.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
function guest(storage = new Map()) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, crypto: webcrypto, Uint8Array,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  return exports.guestAuthorization;
}
test('guest checkout creates a cryptographically random capability, not an account', () => {
  assert.match(guest()(), /^Guest [a-f0-9]{64}$/);
  assert.notEqual(guest()(), guest()());
});
test('the same browser can resume its booking after reload', () => {
  const storage = new Map();
  const first = guest(storage)();
  assert.equal(guest(storage)(), first);
});
test('blocked storage fails explicitly instead of risking inaccessible paid bookings', () => {
  const storage = { get() { throw new Error('Storage disabled'); } };
  assert.throws(guest(storage), /السماح بتخزين بيانات الموقع/);
});
