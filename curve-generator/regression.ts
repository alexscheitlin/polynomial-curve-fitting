import regression, { DataPoint, Result } from 'regression';
import { range } from './utils';

/*****************************************************************************/
/* Polynomial Regression with linear least-squares                           */
/*                                                                           */
/* made with https://github.com/Tom-Alexander/regression-js                  */
/*****************************************************************************/

/**
 * Fits the `points` to a polynomial curve with the given `order` with the
 * equation `a_n*x^n ... + a_1*x + a_0`.
 *
 * The coefficients `a_n` have `precision` number of decimal places.
 *
 * Example:
 * https://github.com/Tom-Alexander/regression-js#regressionpolynomialdata-options
 *
 * @param {number[][]} points
 * @param {number} order
 * @param {number} precision
 */
export const polynomialRegression = (
  points: number[][],
  order: number,
  precision: number
): Result => regression.polynomial(points as DataPoint[], { order: order, precision: precision });

/**
 * Generate evenly distributed points between `xMin` and `xMax` on a polynomial
 * curve with the given `order`.
 *
 * The polynomial is created using linear least-squares regression with the
 * provided `points`. The coefficients of the polynomial have `precision`
 * number of decimal places.
 *
 * @param {number[][]} points
 * @param {number} order
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} precision
 * @returns {number[][]}
 */
export const generateCurvePoints = (
  points: number[][],
  order: number,
  xMin: number,
  xMax: number,
  precision: number
): number[][] => {
  // TODO: check precision of output points (if it is the same as `precision`,
  // then the precision constants of the points and coefficients need to be
  // the same)
  const frequency = 7;
  const xLength = xMax - xMin;
  const regression = polynomialRegression(points, order, precision);
  return range(frequency * xLength + 1)
    .map(x => x / frequency + xMin)
    .map(x => regression.predict(x));
};
