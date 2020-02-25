'use strict';
const Assert = require('assert');
const Hapi = require('@hapi/hapi');
const Lab = require('@hapi/lab');
const Metri = require('../lib');
const { describe, it } = exports.lab = Lab.script();


describe('Metri', () => {
  it('reports expected metrics as JSON when requested', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'application/json' }
    });

    Assert.strictEqual(res.statusCode, 200);
    const metrics = JSON.parse(res.payload);
    Assert(metrics.process !== null && typeof metrics.process === 'object');
    Assert(metrics.system !== null && typeof metrics.system === 'object');
    Assert(Array.isArray(metrics.cpu));
    Assert(typeof metrics.loop === 'number');
    Assert(typeof metrics.handles === 'number');
    Assert(typeof metrics.requests === 'number');
  });

  it('reports expected metrics as Prometheus exposition when requested', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(/nodejs_versions{node=".+"} 1/.test(res.payload));
  });

  it('reports expected metrics as Prometheus exposition by default', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(/nodejs_versions{node=".+"} 1/.test(res.payload));
  });

  it('configures JSON as the default response type', async () => {
    const server = await getServer({ defaultFormat: 'json' });
    const res = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    Assert.strictEqual(res.statusCode, 200);
    const metrics = JSON.parse(res.payload);
    Assert(metrics.process !== null && typeof metrics.process === 'object');
    Assert(metrics.system !== null && typeof metrics.system === 'object');
    Assert(Array.isArray(metrics.cpu));
    Assert(typeof metrics.loop === 'number');
    Assert(typeof metrics.handles === 'number');
    Assert(typeof metrics.requests === 'number');
  });

  it('configures the JSON MIME type', async () => {
    const server = await getServer({ jsonMimeType: 'application/foo' });
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'application/foo' }
    });

    Assert.strictEqual(res.statusCode, 200);
    const metrics = JSON.parse(res.payload);
    Assert(metrics.process !== null && typeof metrics.process === 'object');
    Assert(metrics.system !== null && typeof metrics.system === 'object');
    Assert(Array.isArray(metrics.cpu));
    Assert(typeof metrics.loop === 'number');
    Assert(typeof metrics.handles === 'number');
    Assert(typeof metrics.requests === 'number');
  });

  it('configures the exposition MIME type', async () => {
    const server = await getServer({
      defaultFormat: 'json',
      expositionMimeType: 'application/foo'
    });
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'application/foo' }
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(/# HELP nodejs_event_loop_delay Delay of the Node\.js event loop/.test(res.payload));
  });

  it('throws if the default format is not valid', async () => {
    let threw = false;

    try {
      await getServer({ defaultFormat: 'foo' });
    } catch (err) {
      threw = true;
      Assert(err instanceof Error);
      Assert.strictEqual(err.message, 'defaultFormat must be exposition or json');
    }

    Assert.strictEqual(threw, true);
  });

  it('reports response timings in exposition format', async () => {
    const server = await getServer();
    let res;

    res = await server.inject({
      method: 'GET',
      url: '/foo'
    });
    Assert.strictEqual(res.payload, 'ok');
    Assert.strictEqual(res.statusCode, 200);

    res = await server.inject({
      method: 'GET',
      url: '/bar'
    });
    Assert.strictEqual(res.statusCode, 500);

    res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(res.payload.includes('http_request_duration_ms_count{method="get",path="/foo",code="200"} 1'));
    Assert(res.payload.includes('http_request_duration_ms_count{method="get",path="/bar",code="500"} 1'));
  });

  it('rewrites paths based on formatPaths() option', async () => {
    let called = false;
    const server = await getServer({
      formatPaths (request) {
        called = true;
        return '/not-the-real-path';
      }
    });
    let res = await server.inject({
      method: 'GET',
      url: '/foo'
    });
    Assert.strictEqual(called, true);
    Assert.strictEqual(res.payload, 'ok');
    Assert.strictEqual(res.statusCode, 200);

    res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(res.payload.includes('http_request_duration_ms_count{method="get",path="/not-the-real-path",code="200"} 1'));
  });

  it('ignores paths based on formatPaths() option', async () => {
    let called = false;
    const server = await getServer({
      formatPaths (request) {
        called = true;
        // Do not return a string value here.
      }
    });
    let res = await server.inject({
      method: 'GET',
      url: '/foo'
    });
    Assert.strictEqual(called, true);
    Assert.strictEqual(res.payload, 'ok');
    Assert.strictEqual(res.statusCode, 200);

    res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    Assert.strictEqual(res.statusCode, 200);
    Assert(!res.payload.includes('http_request_duration_ms_count{method="get",path="/foo",code="200"} 1'));
  });
});


async function getServer (options) {
  const server = Hapi.server();

  await server.register({ plugin: Metri, options });

  server.route([
    {
      method: 'GET',
      path: '/foo',
      handler (request, h) {
        return 'ok';
      }
    },
    {
      method: 'GET',
      path: '/bar',
      handler (request, h) {
        throw new Error('bar');
      }
    }
  ]);

  return server;
}
