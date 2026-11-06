import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Run the actual request helper with only its Firebase/network boundaries mocked.
const source = readFileSync(new URL('../artifacts/power-healing/src/lib/eventRegistrations.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function requestWith(serverApi) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, AbortController, DOMException,
    TypeError, SyntaxError, setTimeout, clearTimeout,
    require(name) {
      if (name === './serverApi') return { serverApi };
      if (name === './firebase') return { db: {} };
      if (name === 'firebase/firestore') return { collection: () => ({}) };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports.eventRequest;
}
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json' },
});

test('uses the backend event endpoint and passes an abort signal', async () => {
  const request = requestWith(async (path, init) => {
    assert.equal(path, '/api/event');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { action: 'mine' });
    assert.ok(init.signal instanceof AbortSignal);
    return json({ registration: null });
  });
  assert.equal((await request({ action: 'mine' })).registration, null);
});

test('bounds a stalled network or Firebase-token request and permits retry', async () => {
  let attempt = 0;
  let signal;
  const request = requestWith(async (_, init) => {
    signal = init.signal;
    if (++attempt === 1) return new Promise(() => {});
    return json({ registration: { id: 'existing' } });
  });
  await assert.rejects(request({ action: 'mine' }, { timeoutMs: 10 }), /الوقت المحدد/);
  assert.equal(signal.aborted, true);
  assert.equal((await request({ action: 'mine' })).registration.id, 'existing');
});

test('bounds a stalled response body, not just the response headers', async () => {
  const request = requestWith(async () => ({
    ok: true, headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => new Promise(() => {}),
  }));
  await assert.rejects(request({ action: 'mine' }, { timeoutMs: 10 }), /الوقت المحدد/);
});

test('rejects HTML fallback pages instead of treating them as an empty registration', async () => {
  const request = requestWith(async () => new Response('<html>Fallback</html>', {
    headers: { 'Content-Type': 'text/html' },
  }));
  await assert.rejects(request({ action: 'mine' }), /غير متاحة/);
});

test('handles network and backend failures explicitly', async () => {
  const offline = requestWith(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(offline({ action: 'mine' }), /تحقق من اتصالك/);
  const denied = requestWith(async () => json({ error: 'Authentication required' }, 401));
  await assert.rejects(denied({ action: 'mine' }), /Authentication required/);
});

test('rejects malformed JSON without assuming there is no previous booking', async () => {
  const request = requestWith(async () => new Response('{bad', {
    headers: { 'Content-Type': 'application/json' },
  }));
  await assert.rejects(request({ action: 'mine' }), /استجابة خدمة التسجيل/);
});

test('cancels a pending request on route cleanup', async () => {
  const controller = new AbortController();
  let signal;
  const request = requestWith(async (_, init) => {
    signal = init.signal;
    return new Promise(() => {});
  });
  const result = request({ action: 'mine' }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
  assert.equal(signal.aborted, true);
});
