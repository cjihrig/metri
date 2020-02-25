# metri

[![Current Version](https://img.shields.io/npm/v/metri.svg)](https://www.npmjs.org/package/metri)
[![Build Status via Travis CI](https://travis-ci.org/cjihrig/metri.svg?branch=master)](https://travis-ci.org/cjihrig/metri)
![Dependencies](http://img.shields.io/david/cjihrig/metri.svg)
[![belly-button-style](https://img.shields.io/badge/eslint-bellybutton-4B32C3.svg)](https://github.com/cjihrig/belly-button)

hapi plugin for returning Node.js process metrics.

## Basic Usage

```javascript
'use strict';
const Hapi = require('@hapi/hapi');
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

### `formatPaths(request)`

`metri` tracks request response times via a histogram. By default, times are tracked by HTTP method, path, and response status code (`GET /foo 200` for example). By default, the path is obtained via hapi's `request.path`. However, for use cases such as GraphQL, `request.path` may not be the ideal way to identify requests. `formatPaths()` is an optional function that takes the hapi request object as an input, and returns the path to be used by the response timing histogram. If `formatPaths()` returns a non-string value, the response is not recorded in the histogram. This is useful for ignoring routes, such as `/health`.

### `defaultFormat`

The default response type. Valid values are `'json'` and `'exposition'`. Defaults to `'exposition'`.

### `expositionMimeType`

The MIME type used to return exposition data. Defaults to `'text/plain'`.

### `jsonMimeType`

The MIME type used to return JSON data. Defaults to `'application/json'`.
