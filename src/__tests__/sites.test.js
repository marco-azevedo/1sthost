// Minimal tests using Node's built-in test runner (no extra deps needed).
const assert = require('node:assert/strict');
const { test } = require('node:test');

// Re-export the validation helper by requiring the module under test.
// We use a small trick: expose the function via a module-level export
// from routes/sites.js.  Since it isn't exported yet we test it
// indirectly through the HTTP layer by starting the app.

const http = require('node:http');
const app = require('../index');

let server;
let baseUrl;

// Helpers ---------------------------------------------------------------

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      method,
      hostname: '127.0.0.1',
      port: new URL(baseUrl).port,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Lifecycle -------------------------------------------------------------

test('setup', async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

// Domain-validation tests -----------------------------------------------

test('POST /api/sites accepts a valid domain', async () => {
  const res = await request('POST', '/api/sites', { domain: 'example.com', owner: 'alice' });
  assert.equal(res.status, 201);
  assert.equal(res.body.domain, 'example.com');
});

test('POST /api/sites accepts a subdomain', async () => {
  const res = await request('POST', '/api/sites', { domain: 'www.my-app.io', owner: 'bob' });
  assert.equal(res.status, 201);
});

test('POST /api/sites rejects a domain with a leading hyphen in a label', async () => {
  const res = await request('POST', '/api/sites', { domain: '-bad.com', owner: 'alice' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Invalid domain/);
});

test('POST /api/sites rejects a domain with a trailing hyphen in a label', async () => {
  const res = await request('POST', '/api/sites', { domain: 'bad-.com', owner: 'alice' });
  assert.equal(res.status, 400);
});

test('POST /api/sites rejects a domain with invalid characters', async () => {
  const res = await request('POST', '/api/sites', { domain: 'exam_ple.com', owner: 'alice' });
  assert.equal(res.status, 400);
});

test('POST /api/sites rejects an empty string domain', async () => {
  const res = await request('POST', '/api/sites', { domain: '', owner: 'alice' });
  assert.equal(res.status, 400);
});

test('POST /api/sites rejects a domain exceeding 253 characters', async () => {
  // 63+1+63+1+63+1+63+1+3 = 259 chars — safely over the 253 limit.
  const longDomain = 'a'.repeat(63) + '.' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(63) + '.com';
  const res = await request('POST', '/api/sites', { domain: longDomain, owner: 'alice' });
  assert.equal(res.status, 400);
});

// Teardown --------------------------------------------------------------

test('teardown', async () => {
  await new Promise((resolve) => server.close(resolve));
});
