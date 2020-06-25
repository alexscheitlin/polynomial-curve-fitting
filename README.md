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

Use the react component generating a random curve:

<details>
<summary>JavaScript Example</summary>

```jsx
import React from 'react';
import PolynomialCurveFitting from 'polynomial-curve-fitting';

const App = () => <PolynomialCurveFitting></PolynomialCurveFitting>;

export default App;
```

</details>

<details open="">
<summary>TypeScript Example</summary>

```tsx
import React from 'react';
import PolynomialCurveFitting from 'polynomial-curve-fitting';

const App = () => <PolynomialCurveFitting></PolynomialCurveFitting>;

export default App;
```

</details>

The following sections show:

1. how to specify a curve
2. how to provide graph settings
3. how to get the curve as output

### Specify a Curve

To provide initial information about the curve, there are four options:

1. Use `PropsBaseCurve` and specify the following fields (all optional):

   <details>
   <summary>JavaScript Example</summary>

   ```javascript
   const curve1 = {
     name: 'Fancy Polynomial',
     description: 'This polynomial is a random polynomial.',
     xAxis: { label: 'x Axis', min: 0, max: 10 },
     yAxis: { label: 'y Axis', min: 0, max: 10 },
   };
   ```

   </details>

   <details open="">
   <summary>TypeScript Example</summary>

   ```typescript
   import { PropsBaseCurve } from 'polynomial-curve-fitting/lib/types';
   const curve1: PropsBaseCurve = {
     name: 'Fancy Polynomial',
     description: 'This polynomial is a random polynomial.',
     xAxis: { label: 'x Axis', min: 0, max: 10 },
     yAxis: { label: 'y Axis', min: 0, max: 10 },
   };
   ```

   </details>

2. Use `PropsCurvePoints` to specify points for the least squares regression. The order of the polynomial will be one less than the number of provided points. The fields of `PropsBaseCurve` are still optional, but the `points` field is required:

   <details>
   <summary>JavaScript Example</summary>

   ```javascript
   const curve2 = {
     points: [
       [0, 0],
       [1, 1],
     ],
   };
   ```

   </details>

   <details open="">
   <summary>TypeScript Example</summary>

   ```typescript
   import { PropsCurvePoints } from 'polynomial-curve-fitting/lib/types';
   const curve2: PropsCurvePoints = {
     points: [
       [0, 0],
       [1, 1],
     ],
   };
   ```

   </details>

3. Use `PropsCurveOrder` to specify the order of the polynomial. The points on the curve are randomly generated. The fields of `PropsBaseCurve` are still optional, but the `polynomialOrder` field is required:

   <details>
   <summary>JavaScript Example</summary>

   ```javascript
   const curve3 = {
     polynomialOrder: 2,
   };
   ```

   </details>

   <details open="">
   <summary>TypeScript Example</summary>

   ```typescript
   import { PropsCurveOrder } from 'polynomial-curve-fitting/lib/types';
   const curve3: PropsCurveOrder = {
     polynomialOrder: 2,
   };
   ```

   </details>

4. Use `PropsCurveCoefficients` to specify the coefficients of the polynomial. When optionally specifying points, the x values are taken to create points on the curve (ideally the y values match). If no points have been specified, they are randomly generated. The fields of `PropsBaseCurve` are still optional, but the `coefficients` field is required:

   <details>
   <summary>JavaScript Example</summary>

   ```javascript
   const curve4 = {
     coefficients: [-0.1, 1.25, 5],
     points: [
       [0, 5],
       [1, 6.15],
       [2, 7.1],
     ],
   };
   ```

   </details>

   <details open="">
   <summary>TypeScript Example</summary>

   ```typescript
   import { PropsCurveCoefficients } from 'polynomial-curve-fitting/lib/types';
   const curve4: PropsCurveCoefficients = {
     coefficients: [-0.1, 1.25, 5],
     points: [
       [0, 5],
       [1, 6.15],
       [2, 7.1],
     ],
   };
   ```

   </details>

Provide the information about the curve as follows:

<details>
<summary>JavaScript Example</summary>

```jsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import React from 'react';

// const curve ...

const App = () => <PolynomialCurveFitting curve={curve}></PolynomialCurveFitting>;

export default App;
```

</details>

<details open="">
<summary>TypeScript Example</summary>

```tsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import React from 'react';

// const curve ...

const App = () => <PolynomialCurveFitting curve={curve}></PolynomialCurveFitting>;

export default App;
```

</details>

### Provide Settings

In addition to the `curve` prop, there is also a `settings` prop that allows to set the style of the drawn graph (e.g, the size of the svg, font sizes, colors, and spacing). Have a look at the [default props](./src/default-props.ts) to see the default settings and what can be changed.

```jsx
const App = () => <PolynomialCurveFitting settings={settings}></PolynomialCurveFitting>;
```

### Get Curve

To get updates on the curve while changing it within the component, use a callback function as shown in the following example:

<details>
<summary>JavaScript Example</summary>

```jsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import React from 'react';

const App = () => {
  const [curve, setCurve] = React.useState();
  return (
    <div>
      <PolynomialCurveFitting curveChange={value => setCurve(value)}></PolynomialCurveFitting>
      <pre>
        {JSON.stringify(curve, (_, v) => (v instanceof Array ? JSON.stringify(v, null) : v), 3)}
      </pre>
    </div>
  );
};

export default App;
```

</details>

<details open="">
<summary>TypeScript Example</summary>

```tsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import { CurveOut } from 'polynomial-curve-fitting/lib/types';
import React from 'react';

const App = () => {
  const [curve, setCurve] = React.useState<CurveOut>();
  return (
    <div>
      <PolynomialCurveFitting
        curveChange={(value: CurveOut) => setCurve(value)}
      ></PolynomialCurveFitting>
      <pre>
        {JSON.stringify(curve, (_, v) => (v instanceof Array ? JSON.stringify(v, null) : v), 3)}
      </pre>
    </div>
  );
};

export default App;
```

</details>

### Set Translations

The `internationalization` prop accepts a `PropsInternationalization` object specifying translations. Depending on the current UI language change the `i18n` object in the following example to either `ENGLISH` or `GERMAN`. Have a look at the [default props](./src/default-props.ts) to see the default strings and what can be changed. Note that every string is optional.

<details>
<summary>JavaScript Example</summary>

```jsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import React from 'react';

const ENGLISH = {
  textSettings: { title: 'English Title' },
};

const GERMAN = {
  textSettings: {
    title: 'German Title',
    curveName: {
      label: 'German Label',
    },
  },
};

const App = () => {
  const [lang, setLang] = React.useState('en');
  const [i18n, setI18n] = React.useState(ENGLISH);

  const langChange = newLang => {
    setLang(newLang);
    newLang === 'en' && setI18n(ENGLISH);
    newLang === 'de' && setI18n(GERMAN);
  };

  return (
    <div>
      <select value={lang} onChange={e => langChange(e.target.value)}>
        <option value="en">EN</option>
        <option value="de">DE</option>
      </select>
      <PolynomialCurveFitting internationalization={i18n}></PolynomialCurveFitting>
    </div>
  );
};

export default App;
```

</details>

<details open="">
<summary>TypeScript Example</summary>

```tsx
import PolynomialCurveFitting from 'polynomial-curve-fitting';
import { PropsInternationalization } from 'polynomial-curve-fitting/lib/types';
import React from 'react';

const ENGLISH: PropsInternationalization = {
  textSettings: { title: 'English Title' },
};

const GERMAN: PropsInternationalization = {
  textSettings: {
    title: 'German Title',
    curveName: {
      label: 'German Label',
    },
  },
};

const App = () => {
  const [lang, setLang] = React.useState<string>('en');
  const [i18n, setI18n] = React.useState<PropsInternationalization>(ENGLISH);

  const langChange = (newLang: string) => {
    setLang(newLang);
    newLang === 'en' && setI18n(ENGLISH);
    newLang === 'de' && setI18n(GERMAN);
  };

  return (
    <div>
      <select value={lang} onChange={e => langChange(e.target.value)}>
        <option value="en">EN</option>
        <option value="de">DE</option>
      </select>
      <PolynomialCurveFitting internationalization={i18n}></PolynomialCurveFitting>
    </div>
  );
};

export default App;
```

</details>

## Development

The following steps show how to make changes to `polynomial-curve-fitting` and use the component in an `pcf-example` react app. The commands used below assume that the two projects are sibling directories.

### Clone and Build `polynomial-curve-fitting`

Within the terminal, execute the following commands:

```bash
# clone the repository
git clone https://github.com/alexscheitlin/polynomial-curve-fitting.git

# install the dependencies
cd polynomial-curve-fitting
npm install

# continuously build the library
npm run build:watch
```

### Create new React App `pcf-example`

Open a new terminal tab and execute the following commands:

```bash
# create new react app with typescript
npx create-react-app pcf-example --template typescript

# install this library as a dependency
cd pcf-example
npm install ../polynomial-curve-fitting

# link react of the library with the one of the example react app
cd ../polynomial-curve-fitting/
npm link ../pcf-example/node_modules/react

# only do this if the example react app uses material ui
# link material ui of the library with the one of the example react app
npm link ../pcf-example/node_modules/@material-ui/core

# start the example react app
cd ../pcf-example/
npm run start
```

Add the react component to the `App.tsx` file (see Usage)
