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
  defaultFormat: 'exposition',
  formatPaths: null
};


function register (server, options) {
  const settings = Object.assign({}, defaults, options);
  const pm = new NodeProcessMetrics();
  const registry = new Prometheus.CollectorRegistry();
  let prometheus;

  if (settings.defaultFormat !== 'exposition' &&
      settings.defaultFormat !== 'json') {
    throw new Error('defaultFormat must be exposition or json');
  }

  if (typeof settings.setupCollectors === 'function') {
    prometheus = settings.setupCollectors([registry], pm);
  } else if (settings.setupCollectors === undefined) {
    prometheus = new PrometheusMetrics({
      metrics: pm,
      registries: [registry]
    });
  } else {
    throw new TypeError('setupCollectors must be a function');
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

    server.events.on('response', (request) => {
      const path = typeof settings.formatPaths === 'function' ?
        settings.formatPaths(request) : request.path;

      if (typeof path !== 'string') {
        return;
      }

      const span = request.info.completed - request.info.received;

      requestTimes.observe(span, {
        method: request.method,
        path,
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

module.exports = {
  register,
  requirements: {
    hapi: '>=17.0.0'
  },
  pkg: Package
};
