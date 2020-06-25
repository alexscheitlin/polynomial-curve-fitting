import {
  Curve,
  DefaultProps,
  Props,
  PropsBaseCurve,
  PropsCurveCoefficients,
  PropsCurveOrder,
  PropsCurvePoints,
  Settings,
} from '../types';
import * as Regression from '../utils/regression';
import * as Utils from '../utils/utils';

/**
 * Generate the `Curve` for the react component based on the provided `props` and `defaultProps`.
 *
 * Any of the settings set in the `props` object are considered. If there is no value specified in the
 * `props` object, the values is taken from the `defaultProps` object where there is always a value set.
 *
 * Depending on whether points or the order of the polynomial are specified, the missing piece of information
 * is inferred/created. If neither of them is specified, the order of the `defaultProps` is taken and random
 * points are generated.
 *
 * Some additional fields are set based on the previousy definded curve to define the `extra` properties
 * required by the `Curve` type.
 * @param {Props} props the props passed to the react component
 * @param {DefaultProps} defaultProps the default props
 * @param {Settings} settings the already extracted settings from the `props` and `defaultProps`
 */
export const generateCurve = (
  props: Props,
  defaultProps: DefaultProps,
  settings: Settings
): Curve => {
  const curve = props?.curve;
  const defaultCurve = defaultProps.curve;

  const propsCurve: Required<PropsBaseCurve> = {
    name: curve?.name || defaultCurve.name,
    description: curve?.description || defaultCurve.description,
    xAxis: {
      label: curve?.xAxis?.label || defaultCurve.xAxis.label,
      min: curve?.xAxis?.min || defaultCurve.xAxis.min,
      max: curve?.xAxis?.max || defaultCurve.xAxis.max,
    },
    yAxis: {
      label: curve?.yAxis?.label || defaultCurve.yAxis.label,
      min: curve?.yAxis?.min || defaultCurve.yAxis.min,
      max: curve?.yAxis?.max || defaultCurve.yAxis.max,
    },
  };

  // additional fields for the `Curve` type
  let points = (curve as PropsCurvePoints)?.points;
  let polynomialOrder = (curve as PropsCurveOrder)?.polynomialOrder;
  const coefficients = (curve as PropsCurveCoefficients)?.coefficients;
  if (points) {
    polynomialOrder = points.length - 1;

    if (coefficients) {
      // TODO: this needs to match
      polynomialOrder = coefficients.length - 1;
    }
  } else if (polynomialOrder) {
    // skip
  } else if (coefficients) {
    polynomialOrder = coefficients.length - 1;
  } else {
    polynomialOrder = defaultProps.curve.polynomialOrder;
  }

  // generate random points if the points have not been specified
  if (!points || points.length === 0) {
    points = Utils.generateRandomPoints(
      polynomialOrder + 1,
      settings.precisionPoints,
      propsCurve.xAxis.min,
      propsCurve.xAxis.max,
      propsCurve.yAxis.min,
      propsCurve.yAxis.max
    );
  }

  // if coefficients have been specified, compute y values for the given x values of either
  // - the specified points or
  // - the random generated points
  if (coefficients) {
    points = points.map(point => [point[0], Utils.polynomialValue(point[0], coefficients)]);
  }

  const regression = Regression.polynomialRegression(
    points,
    polynomialOrder,
    settings.precisionCoefficient
  );

  // rescale coordinate system
  if (settings.autoRescale) {
    // get the min/max values for both axes (based on the coordinates of the points)
    const xCoordinates = points.map(point => point[0]);
    const yCoordinates = points.map(point => point[1]);
    const xSpan = [Math.min(...xCoordinates), Math.max(...xCoordinates)];
    const ySpan = [Math.min(...yCoordinates), Math.max(...yCoordinates)];

    // set the min/max values of the axes so that
    // - all points are displayed
    // - both axes have the same "length"
    // - there is a margin around the new view so that no point is placed on the border of the view
    // Note: floor/ceil the values so that the min/max values of the axes are integers (which is required for the
    //       random curve point generation)
    const margin = 0.25; // in percentage of the maxLength
    let maxLength = Math.max(xSpan[1] - xSpan[0], ySpan[1] - ySpan[0]);
    const xSpanStart = Math.floor(xSpan[0] - maxLength * margin);
    const ySpanStart = Math.floor(ySpan[0] - maxLength * margin);
    maxLength = Math.ceil(maxLength * (1 + 2 * margin));

    propsCurve.xAxis.min = xSpanStart;
    propsCurve.xAxis.max = xSpanStart + maxLength;
    propsCurve.yAxis.min = ySpanStart;
    propsCurve.yAxis.max = ySpanStart + maxLength;
  }

  return {
    ...propsCurve,

    points: points,
    polynomialOrder: polynomialOrder,

    curvePoints: Regression.generateCurvePoints(
      points,
      polynomialOrder,
      propsCurve.xAxis.min,
      propsCurve.xAxis.max,
      settings.precisionCoefficient
    ),
    coefficients: regression.equation,
    equation: regression.string,
    r2: regression.r2,
  };
};
