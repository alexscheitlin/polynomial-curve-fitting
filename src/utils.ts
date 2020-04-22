import { polynomialRegression } from './regression';

/*****************************************************************************/
/* Utils                                                                     */
/*****************************************************************************/

/**
 * Deep copy an object.
 *
 * @param {any} x
 * @returns {any}
 */
export const deepCopy = (x: any): any => JSON.parse(JSON.stringify(x));

/**
 * Round the number `n` to `p` decimal places.
 *
 * Example:
 * `(7.128, 2)` => `7.13`
 *
 * @param {number} n
 * @param {number} p
 * @returns {number}
 */
export const round = (n: number, p: number): number => {
  const m = Math.pow(10, p);
  return Math.round(n * m) / m;
};

/**
 * Create a range of `n` numbers starting from `0` up to `n-1`.
 *
 * Example:
 * `(5)` => `[0, 1, 2, 3, 4]`
 *
 * @param {number} n
 * @returns {number[]}
 */
export const range = (n: number): number[] => [...Array(n).keys()];

/**
 * Create `n` points that are evenly distributed between `xMin` and `xMax` and
 * have random y values between `yMin` and `yMax`.
 *
 * The x-coordinate of the first point is `0` and the x-coordinate of the last
 * point is `xMax`. The y-coordinate is a random value between `0` and yMax`.
 * All coordinates have `p` decimal places.
 *
 * Example:
 * `(3, 2, -10, 10, -10, 10)` => `[[-10, -5.02], [0, 6.5], [10, -4.91]]
 *
 * @param {number} n the number of points to generate
 * @param {number} p the precision of the coordinates (i.e., the number of decimal places)
 * @param {number} xMin the minimum value of the x axis (needs to be smaller than `xMax`)
 * @param {number} xMax the maximum value of the x axis (needs to be greater than `xMin`)
 * @param {number} yMin the minimum value of the y axis (needs to be smaller than `yMax`)
 * @param {number} yMax the maximum value of the y axis (needs to be greater than `yMin`)
 * @returns {number[][]}
 */
export const generateRandomPoints = (
  n: number,
  p: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): number[][] => {
  const xLength = xMax - xMin;
  const yLength = yMax - yMin;

  // get array with `n` elements from `0` to `n-1`
  return (
    range(n)
      // get points with `x` eqaully distributed between `0` and `xLength` and `y` being a
      // random value between `0` and `yLength`
      .map(i => [(xLength / (n - 1)) * i, Math.random() * yLength])
      // shift `x` and `y` values acording to `xMin` and `yMin`
      .map(point => [point[0] + xMin, point[1] + yMin])
      // round `y` value to precision `p`
      .map(point => [point[0], round(point[1], p)])
  );
};

/**
 * Sort the provided `points` by their x values.
 *
 * The sorting does not happen in-place. A shallow (but NO deep) copy of the
 * array is created, sorted, and returned.
 * @param {number[][]} points Points with `x` and `y` values as first and
 *                            second array items (e.g, `x,y` = `3,4` =>
 *                            `[3, 4]`).
 * @returns {number[][]}
 */
export const sortPointsByX = (points: number[][]): number[][] =>
  [...points].sort((a, b) => a[0] - b[0]);

/**
 * Remove the second point from the list of `points` in-place and return the
 * removed item. If there is no second item to be removed, `false` is returned.
 *
 * Examples:
 * - `([[0, 1], [4, 2], [3,5]])` => `[4, 2]`
 * - `([[0, 1]])` => `false`
 *
 * @param {any} points
 */
export const removePoint = (points: any): any => points.length > 1 && points.splice(1, 1);

// TODO: properly check whether this works with negative coordinates
/**
 * Insert a new point (lying on a curve) into the provided list of `points`
 * (in-place).
 *
 * The curve is a polynomial generated using linear least-squares regression
 * with the provided `points`. The coefficients of the polynomial have
 * `coefficientPrecision` number of decimal places. The inserted point
 * has `pointsPrecision` number of decimal places.
 *
 * @param {number[][]} points
 * @param {number} coefficientPrecision
 * @param {number} pointsPrecision
 */
export const addPoint = (
  points: number[][],
  coefficientPrecision: number,
  pointsPrecision: number
): void => {
  // get max difference on x axis between neighboring points
  const maxDiff = Math.max(...points.map((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0])));

  // the x coordinate of the point to insert shall be between the two points
  // having the largest distance (centered)
  // => get the new x value
  const newX =
    (points.find((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0]) === maxDiff) || [0, 0])[0] +
    maxDiff / 2;

  // based on the already existing points, make a linear least-squares
  // regression and get the corresponding y coordinate to the just
  // computed x coordinate
  const newY = polynomialRegression(points, points.length - 1, coefficientPrecision).predict(
    newX
  )[1];

  // insert new point into the list of points and sort the list by the point's
  // x-coordinate
  points.push([round(newX, pointsPrecision), round(newY, pointsPrecision)]);
  points = sortPointsByX(points);
};

/**
 * Given the `x` value, calculate the corresponding `y` value on the polynomial
 * defined by the provided `coefficients`.
 *
 * Example:
 * `(2, [-1, 2, 1])` => `1` | polynomial: *y = -x^2 + 2x + 1*
 *
 * @param {number} x
 * @param {number[]} coefficients
 * @returns {number}
 */
export const polynomialValue = (x: number, coefficients: number[]): number =>
  coefficients.map((c, i) => c * Math.pow(x, coefficients.length - i - 1)).reduce((a, b) => a + b);

/**
 * Generate the polynomial equation given the polynomial's `coefficients`.
 *
 * Example:
 * `[3,-2,1]` => `3*x^2 - 2*x + 1`
 *
 * @param {number[]} coefficients
 * @returns {string}
 */
export const generatePolynomialEquation = (coefficients: number[]): string =>
  coefficients
    .map((coefficient, index) => {
      // polynomial (poly: many, nomial: terms)
      // polynomial:    -4*x^2 + 3*x - 0.5
      // terms:         -4*x^2,  3*x, -0.5
      // coefficients:      -4,    3, -0.5
      // signs:              -,    +,    -
      // exponents:          2,    1,    0
      // variable:                       x

      const variable = 'x';
      const exponent = coefficients.length - index - 1;

      // check whether there is any term before this one by ...
      const anyTermShownBefore =
        coefficients
          // ... taking all coefficients before this one and
          .slice(0, index)
          // ... summing them up and if the sum is not 0, there is a term before this one
          .reduce((a, b) => Math.abs(a) + Math.abs(b), 0) !== 0;

      const isFirstTerm = index === 0;

      let sign = '';
      // - only use spaces if it is not the first term
      // - do not show a '+' if it is the first term
      // - do not show a '+' or spaces for a '-' if all terms before have a
      //   coefficient of value '0' and therefore are not shown
      if (coefficient >= 0) {
        sign = isFirstTerm || !anyTermShownBefore ? '' : ' + ';
      } else {
        sign = isFirstTerm || !anyTermShownBefore ? '-' : ' - ';
      }

      let variablePart = ''; // x^0 => ''
      if (exponent > 1) {
        // x^2, x^3, x^4, ...
        variablePart = `${variable}^${exponent}`;
      } else if (exponent === 1) {
        // x^1 => x
        variablePart = `${variable}`;
      }

      let coefficientPart = Math.abs(coefficient).toString();
      // do not show a '1' as coefficient if there is a variable coming
      if (coefficientPart === '1' && variablePart != '') {
        coefficientPart = '';
      }

      const multiplication = variablePart && coefficientPart ? '*' : '';

      return coefficientPart !== '0'
        ? `${sign}${coefficientPart}${multiplication}${variablePart}`
        : '';
    })
    .join('');

/**
 * Given the `precision` (i.e., the number of decimal places), compute the
 * step size for an input element of type number.
 *
 * Example:
 * `3` => `0.001`
 *
 * @param {number} precision
 * @returns {number}
 */
export const precisionToStepSize = (precision: number): number => Math.pow(10, -precision);

/**
 * For a polynomial equation (e.g., -7 * x^3 + 3 * x^2 + x + 5), construct the 'terms'
 * (e.g., '* x^3 +', '* x^2 +' and '+').
 *
 * @param n the total number of coefficients of the polynomial
 * @param i the index of the coefficient to get the 'term' (starting with 0)
 * @param variable the variable of the polynomial (e.g., 'x')
 */
export const generatePolynomialTerm = (n: number, i: number, variable: string): string => {
  let result = '';

  if (n - i - 1 > 1) {
    // exponent is larger than 1
    result += ` * ${variable}^` + (n - i - 1).toString();
  }

  if (n - i - 1 === 1) {
    // exponent is equal to 1
    result += ` * ${variable}`;
  }

  if (i < n - 1) {
    // this is not the last 'term' of the equation
    result += ' + ';
  }

  return result;
};
