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
  it('reports expected metrics as JSON by default', async () => {
    const server = await getServer();
    const res = await server.inject({ method: 'GET', url: '/metrics' });

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
    expect(res.payload).to.match(/# HELP nodejs_event_loop_delay Delay of the Node\.js event loop/);
  });
});


async function getServer () {
  const server = Hapi.server();

  await server.register({ plugin: Metri });

  return server;
}
