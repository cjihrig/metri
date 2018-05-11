'use strict';
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Metri = require('../lib');

// Test shortcuts
const lab = exports.lab = Lab.script();
const { describe, it } = lab;
const { expect } = Code;


describe('Metri', () => {
  it('reports expected metrics as JSON when requested', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'application/json' }
    });

    expect(res.statusCode).to.equal(200);
    const metrics = JSON.parse(res.payload);
    expect(metrics.process).to.be.an.object();
    expect(metrics.system).to.be.an.object();
    expect(metrics.cpu).to.be.an.array();
    expect(metrics.loop).to.be.a.number();
    expect(metrics.handles).to.be.a.number();
    expect(metrics.requests).to.be.a.number();
  });

  it('reports expected metrics as Prometheus exposition when requested', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.payload).to.match(/nodejs_versions{node=".+"} 1/);
  });

  it('reports expected metrics as Prometheus exposition by default', async () => {
    const server = await getServer();
    const res = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    expect(res.statusCode).to.equal(200);
    expect(res.payload).to.match(/nodejs_versions{node=".+"} 1/);
  });

  it('configures JSON as the default response type', async () => {
    const server = await getServer({ defaultFormat: 'json' });
    const res = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    expect(res.statusCode).to.equal(200);
    const metrics = JSON.parse(res.payload);
    expect(metrics.process).to.be.an.object();
    expect(metrics.system).to.be.an.object();
    expect(metrics.cpu).to.be.an.array();
    expect(metrics.loop).to.be.a.number();
    expect(metrics.handles).to.be.a.number();
    expect(metrics.requests).to.be.a.number();
  });

  it('configures the JSON MIME type', async () => {
    const server = await getServer({ jsonMimeType: 'application/foo' });
    const res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'application/foo' }
    });

    expect(res.statusCode).to.equal(200);
    const metrics = JSON.parse(res.payload);
    expect(metrics.process).to.be.an.object();
    expect(metrics.system).to.be.an.object();
    expect(metrics.cpu).to.be.an.array();
    expect(metrics.loop).to.be.a.number();
    expect(metrics.handles).to.be.a.number();
    expect(metrics.requests).to.be.a.number();
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

    expect(res.statusCode).to.equal(200);
    expect(res.payload).to.match(/# HELP nodejs_event_loop_delay Delay of the Node\.js event loop/);
  });

  it('throws if the default format is not valid', async () => {
    let threw = false;

    try {
      await getServer({ defaultFormat: 'foo' });
    } catch (err) {
      threw = true;
      expect(err).to.be.an.error(Error, 'defaultFormat must be exposition or json');
    }

    expect(threw).to.be.true();
  });

  it('reports response timings in exposition format', async () => {
    const server = await getServer();
    let res;

    res = await server.inject({
      method: 'GET',
      url: '/foo'
    });
    expect(res.payload).to.equal('ok');
    expect(res.statusCode).to.equal(200);

    res = await server.inject({
      method: 'GET',
      url: '/bar'
    });
    expect(res.statusCode).to.equal(500);

    res = await server.inject({
      method: 'GET',
      url: '/metrics',
      headers: { 'Accept': 'text/plain' }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.payload).to.include('http_request_duration_ms_count{method="get",path="/foo",code="200"} 1');
    expect(res.payload).to.include('http_request_duration_ms_count{method="get",path="/bar",code="500"} 1');
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
