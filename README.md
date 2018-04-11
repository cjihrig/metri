# metri

[![Current Version](https://img.shields.io/npm/v/metri.svg)](https://www.npmjs.org/package/metri)
[![Build Status via Travis CI](https://travis-ci.org/cjihrig/metri.svg?branch=master)](https://travis-ci.org/cjihrig/metri)
![Dependencies](http://img.shields.io/david/cjihrig/metri.svg)
[![belly-button-style](https://img.shields.io/badge/eslint-bellybutton-4B32C3.svg)](https://github.com/cjihrig/belly-button)

hapi plugin for returning Node.js process metrics.

## Basic Usage

```javascript
'use strict';
const Hapi = require('hapi');
const Metri = require('metri');
const server = Hapi.server();

await server.register({ plugin: Metri });
// Metrics now available via GET /metrics
```

## API

`metri` is a hapi plugin that supports the following options.

### `path`

An optional string that defaults to `'/metrics'`. This is the path that serves the metrics data.

### `auth`

The hapi authentication to apply to the metrics route. Defaults to `false` (no authentication).
