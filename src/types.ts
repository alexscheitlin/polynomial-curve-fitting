import { Theme } from '@material-ui/core/styles';

/*****************************************************************************/
/* Properties                                                                */
/*****************************************************************************/

// Both the curve and settings are optional.
// A curve can be specified in three different ways:
// 1. only provide base information and get a random polynomial
// 2. additionally specify curve points to get a regression through these points
// 3. instead of points, specify the order of the polynomial and points are
//    randomly chosen
export interface Props {
  curve?: PropsBaseCurve | PropsCurvePoints | PropsCurveOrder;
  settings?: PropsSettings;
  curveChange?: (value: CurveOut) => void;
  theme?: Theme;
}

// Mirror the `Props` from above but require all fields to be present
// (except the 'output callback' and material ui theme).
export interface DefaultProps {
  curve: Required<PropsCurveOrder>;
  settings: Required<PropsSettings>;
}

export interface PropsBaseCurve {
  name?: string;
  description?: string;
  xAxis?: Axis;
  yAxis?: Axis;
}

export interface PropsCurvePoints extends PropsBaseCurve {
  points: number[][];
}

export interface PropsCurveOrder extends PropsBaseCurve {
  polynomialOrder: number;
}

export interface PropsSettings {
  crosshairColor?: string;
  showDottedCurve?: boolean;

  curve?: CurveSettings;
  initialCurve?: CurveSettings;
  draggablePoint?: DraggablePointSettings;
  graph?: GraphSettings;
  svg?: SvgSettings;
}

/*****************************************************************************/
/* Main Types                                                                */
/*****************************************************************************/
// All prop fields are required and some additional fields are available.

export interface Curve extends Required<PropsBaseCurve> {
  points: number[][];
  polynomialOrder: number;

  curvePoints: number[][];
  coefficients: number[];
  equation: string;
  r2: number;
}

export interface CurveOut extends Required<PropsBaseCurve> {
  polynomialEquation: string;
  polynomialOrder: number;
  coefficients: number[];
  points: number[][];
}

export interface Settings extends Required<PropsSettings> {
  graphSize: Size;
  precisionCoefficient: number;
  precisionPoints: number;
  xScale: d3.ScaleLinear<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

/*****************************************************************************/
/* Helper Types                                                              */
/*****************************************************************************/
// These types should not have optional fields as they would become optional
// for the default props too.

export interface AxisSettings {
  color: string;
  labels: TextSettings;
  strokeWidth: number;
}

export interface CurveSettings {
  color: string;
  strokeWidth: number;
}

export interface DraggablePointSettings {
  color: string;
  radius: number;
}

export interface GraphSettings {
  axis: AxisSettings;
  grid: GridSettings;
  margin: Margin;
  title: TextSettings;
}

export interface GridSettings {
  color: string;
}

export interface SvgSettings {
  size: Size;
}

export interface TextSettings {
  color: string;
  fontFamily: string;
  fontSize: number;
}

/*****************************************************************************/

export interface Axis {
  label: string;
  min: number;
  max: number;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Size {
  width: number;
  height: number;
}
