'use strict';
const NodeProcessMetrics = require('node-process-metrics');
const Package = require('../package.json');

const defaults = {
  path: '/metrics',
  auth: false
};


function register (server, options) {
  const settings = Object.assign({}, defaults, options);
  const pm = new NodeProcessMetrics();

  server.route({
    method: 'GET',
    path: settings.path,
    config: {
      auth: settings.auth,
      handler (request, h) {
        return pm.metrics();
      }
    }
  });
}

module.exports = { register, pkg: Package };
