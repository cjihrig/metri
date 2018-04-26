'use strict';
const NodeProcessMetrics = require('node-process-metrics');
const PrometheusMetrics = require('node-process-metrics-prometheus');
const Prometheus = require('prom-dress');
const Package = require('../package.json');

const defaults = {
  path: '/metrics',
  auth: false,
  expositionMimeType: 'text/plain',
  jsonMimeType: 'application/json',
  defaultFormat: 'exposition'
};


function register (server, options) {
  const settings = Object.assign({}, defaults, options);
  const pm = new NodeProcessMetrics();
  const prometheus = new PrometheusMetrics({
    metrics: pm,
    registries: [new Prometheus.CollectorRegistry()]
  });

  if (settings.defaultFormat !== 'exposition' &&
      settings.defaultFormat !== 'json') {
    throw new Error('defaultFormat must be exposition or json');
  }

  server.route({
    method: 'GET',
    path: settings.path,
    config: {
      auth: settings.auth,
      handler (request, h) {
        if (request.headers.accept === settings.expositionMimeType) {
          return prometheus.metrics();
        } else if (request.headers.accept === settings.jsonMimeType) {
          return pm.metrics();
        } else if (settings.defaultFormat === 'exposition') {
          return prometheus.metrics();
        } else {  // Default format is guaranteed to be 'json' by this point.
          return pm.metrics();
        }
      }
    }
  });
}

module.exports = { register, pkg: Package };
