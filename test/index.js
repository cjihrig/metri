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
  it('reports expected metrics', async () => {
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
});


async function getServer () {
  const server = Hapi.server();

  await server.register({ plugin: Metri });

  return server;
}
