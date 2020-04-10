# Polynomial Curve Fitting

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/polynomial-curve-fitting.svg?style=flat)](https://www.npmjs.com/package/polynomial-curve-fitting)

_A React component to interactively compile polyomial curves with D3 using least squares regression_

![Preview](./assets/preview.gif)

## Installation

```bash
npm i polynomial-curve-fitting
```

## Usage

```javascript
import React from 'react';
import CurveGenerator from 'polynomial-curve-fitting';

const curve = {
  name: 'Fancy Polynomial',
  description:
    'This polynomial is a regression through the provided points using the least-squares method.',
  xAxis: { label: 'x Axis' },
  yAxis: { label: 'y Axis' },
  polynomialOrder: 3,
};

const App = () => <CurveGenerator curve={curve}></CurveGenerator>;

export default App;
```

## Development

The following steps show how to make changes to `polynomial-curve-fitting` and use the component in an `example` react app. The commands used below assume that the two projects are sibling directories.

- Clone and build the `polynomial-curve-fitting`

```bash
# clone the repository
git clone https://github.com/alexscheitlin/polynomial-curve-fitting.git && cd polynomial-curve-fitting

# install the dependencies
npm install

# build the component
npm run build
```

- Add the component as a dependency to your `example` react app using the relative path: `"polynomial-curve-fitting": "file:../polynomial-curve-fitting"`

- Within your `example` react app, install the dependencies using: `npm install`

- Within `polynomial-curve-fitting`, link react with the one of your `example` react app using: `npm link ../example/node_modules/react`

- Within `example`, start the app using: `npm run start`

- Within `polynomial-curve-fitting`, continuously build the component to see changes in your `example` react app: `npm run build:watch`
