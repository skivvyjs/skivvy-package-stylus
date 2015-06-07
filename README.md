# Skivvy package: `stylus`
[![npm version](https://img.shields.io/npm/v/@skivvy/skivvy-package-stylus.svg)](https://www.npmjs.com/package/@skivvy/skivvy-package-stylus)
![Stability](https://img.shields.io/badge/stability-stable-brightgreen.svg)
[![Build Status](https://travis-ci.org/skivvyjs/skivvy-package-stylus.svg?branch=master)](https://travis-ci.org/skivvyjs/skivvy-package-stylus)

> Compile CSS using Stylus


## Installation

```bash
skivvy install stylus
```


## Overview

This package allows you to compile CSS using Stylus from within the [Skivvy](https://www.npmjs.com/package/skivvy) task runner.


## Included tasks

### `stylus`

Compile CSS using Stylus

#### Usage:

```bash
skivvy run stylus
```


#### Configuration settings:

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |
| `source` | `string` | Yes | N/A | Path to source Stylus file |
| `destination` | `string` | Yes | N/A | Path to destination CSS file |
| `options` | `object` | No | `{}` | [Stylus API](https://github.com/stylus/stylus/blob/master/docs/js.md) options |

##### Notes:

- `options.filename` is automatically set to the value of the `source` configuration setting