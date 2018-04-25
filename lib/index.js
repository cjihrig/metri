'use strict';
const NodeProcessMetrics = require('node-process-metrics');
const PrometheusMetrics = require('node-process-metrics-prometheus');
const Prometheus = require('prom-dress');
const Package = require('../package.json');

const defaults = {
  path: '/metrics',
  auth: false
};


function register (server, options) {
  const settings = Object.assign({}, defaults, options);
  const pm = new NodeProcessMetrics();
  const prometheus = new PrometheusMetrics({
    metrics: pm,
    registries: [new Prometheus.CollectorRegistry()]
  });

  server.route({
    method: 'GET',
    path: settings.path,
    config: {
      auth: settings.auth,
      handler (request, h) {
        if (request.headers.accept === 'text/plain') {
          return prometheus.metrics();
        }

        return pm.metrics();
      }
    }
  });
}

module.exports = { register, pkg: Package };
