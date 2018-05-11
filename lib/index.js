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
  const registry = new Prometheus.CollectorRegistry();
  const prometheus = new PrometheusMetrics({
    metrics: pm,
    registries: [registry]
  });

  if (settings.defaultFormat !== 'exposition' &&
      settings.defaultFormat !== 'json') {
    throw new Error('defaultFormat must be exposition or json');
  }

  // Configure response time tracking.
  {
    const requestTimes = new Prometheus.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labels: ['method', 'path', 'code'],
      registries: [registry],
      buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
    });

    server.decorate('request', 'startTime', null);

    server.ext('onRequest', (request, h) => {
      request.startTime = process.hrtime();
      return h.continue;
    });

    server.events.on('response', (request) => {
      const duration = process.hrtime(request.startTime);
      const span = duration[0] * 1e3 + duration[1] * 1e-6;

      requestTimes.observe(span, {
        method: request.method,
        path: request.path,
        code: request.response.statusCode
      });
    });
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
