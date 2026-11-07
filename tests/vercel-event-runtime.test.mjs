import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Exercise the actual emitted adapters across the CommonJS -> ESM package
// boundary, with require(ESM) disabled to reproduce the deployed Node runtime.
const root = process.cwd();
await mkdir('generated-artifacts', { recursive: true });
const output = await mkdtemp(path.join(root, 'generated-artifacts/vercel-event-runtime-'));
execFileSync('pnpm', [
  'exec', 'tsc', '--module', 'nodenext', '--moduleResolution', 'nodenext',
  '--target', 'es2022', '--lib', 'es2022,dom,dom.iterable',
  '--types', 'node', '--skipLibCheck', '--strict',
  '--outDir', output, 'api/event.ts', 'api/event-webhook.ts',
], { cwd: root, stdio: 'pipe' });
await writeFile(path.join(output, 'package.json'), '{"type":"commonjs"}');
const backend = path.join(output, 'artifacts/api-server');
await writeFile(path.join(backend, 'package.json'), '{"type":"module"}');
await symlink(path.join(root, 'artifacts/api-server/node_modules'), path.join(backend, 'node_modules'), 'dir');

for (const entry of ['event', 'event-webhook']) {
  const emitted = await readFile(path.join(output, `api/${entry}.js`), 'utf8');
  assert.match(emitted, /import\("\.\.\/artifacts\/api-server\//, 'Native import must survive compilation');
  assert.doesNotMatch(emitted, /require\("\.\.\/artifacts\/api-server\//, 'Do not require the ESM artifact');
}
const child = `
  const assert = require('node:assert/strict');
  const path = require('node:path');
  const { pathToFileURL } = require('node:url');
  const root = ${JSON.stringify(output)};
  function response() {
    return {
      headers: {}, code: 200, body: undefined,
      setHeader(k,v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; return this; },
      end() {}
    };
  }
  (async () => {
    const firebasePath = path.join(root, 'artifacts/api-server/src/lib/event-firebase.js');
    // Control: confirm this runtime reproduces the screenshot's old failure.
    assert.throws(() => require(firebasePath), { code: 'ERR_REQUIRE_ESM' });
    const firebase = await import(pathToFileURL(firebasePath));
    const workflow = await import(pathToFileURL(path.join(root, 'artifacts/api-server/src/lib/event-workflow.js')));
    assert.equal(typeof firebase.eventFirebase, 'function');
    assert.equal(typeof workflow.eventAction, 'function');
    assert.equal(typeof workflow.eventPayPalWebhook, 'function');
    const identity = await import(pathToFileURL(path.join(root, 'artifacts/api-server/src/lib/event-identity.js')));
    const guest = await identity.eventIdentity('Guest ' + 'a'.repeat(64));
    assert.match(guest.uid, /^guest_[a-f0-9]{64}$/);
    assert.equal(guest.admin, undefined);
    const registration = require(path.join(root, 'api/event.js')).default;
    const webhook = require(path.join(root, 'api/event-webhook.js')).default;
    let res = response();
    await registration({ method: 'POST', headers: {}, body: { action: 'mine' } }, res);
    assert.equal(res.code, 401);
    assert.equal(res.body.error, 'Authentication required');
    res = response();
    await registration({ method: 'GET', headers: {} }, res);
    assert.equal(res.code, 405);
    res = response();
    await webhook({ method: 'GET', headers: {} }, res);
    assert.equal(res.code, 405);
    const { eventFailure } = require(path.join(root, 'api/_lib/event-diagnostics.js'));
    const logs = [];
    const originalError = console.error;
    console.error = (line) => logs.push(JSON.parse(line));
    try {
      const diagnostic = eventFailure(new Error('Firebase server credentials are not configured.'), 'event');
      assert.equal(diagnostic.code, 'FIREBASE_CREDENTIALS_MISSING');
      assert.match(diagnostic.reference, /^[a-f0-9-]{36}$/);
      const sensitive = eventFailure(Object.assign(new Error('private-key attendee@example.com Bearer secret'), { code: 7 }), 'event');
      assert.equal(sensitive.code, 'FIRESTORE_PERMISSION_DENIED');
      assert.doesNotMatch(JSON.stringify([logs, sensitive]), /private-key|attendee@example|Bearer secret/);
      assert.equal(eventFailure({ code: 'UNTRUSTED_SECRET', message: 'secret' }, 'event').code, 'EVENT_SERVER_ERROR');
      // No inherited server credentials: actual adapter must classify the
      // startup failure, log it and return a safe diagnostic, not fake success.
      res = response();
      await registration({ method: 'POST', headers: { authorization: 'Guest ' + 'b'.repeat(64) }, body: { action: 'mine' } }, res);
      assert.equal(res.code, 500);
      assert.equal(res.body.code, 'FIREBASE_CREDENTIALS_MISSING');
      assert.equal(logs.at(-1).reference, res.body.reference);
    } finally { console.error = originalError; }
    console.log('PASS: real ESM dependency graph loads through native import; CommonJS adapters load without ERR_REQUIRE_ESM; registration auth and method guards return JSON401/405.');
  })().catch(error => { console.error(error); process.exitCode = 1; });
`;
execFileSync(process.execPath, ['--no-experimental-require-module', '-e', child], {
  cwd: root, stdio: 'inherit', env: { PATH: process.env.PATH, NODE_ENV: 'production' },
});
