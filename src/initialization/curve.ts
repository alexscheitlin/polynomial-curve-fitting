import * as Regression from '../regression';
import {
  Curve,
  DefaultProps,
  Props,
  PropsBaseCurve,
  PropsCurveOrder,
  PropsCurvePoints,
  Settings,
} from '../types';
import * as Utils from '../utils';

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
  if (points) {
    polynomialOrder = points.length - 1;
  } else if (polynomialOrder) {
    // skip
  } else {
    polynomialOrder = defaultProps.curve.polynomialOrder;
  }

  if (!points) {
    points = Utils.generateRandomPoints(
      polynomialOrder + 1,
      settings.precisionPoints,
      propsCurve.xAxis.min,
      propsCurve.xAxis.max,
      propsCurve.yAxis.min,
      propsCurve.yAxis.max
    );
  }

  const regression = Regression.polynomialRegression(
    points,
    polynomialOrder,
    settings.precisionCoefficient
  );

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
