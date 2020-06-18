// Extends the `Required` type so that not only optional fields of the type T
// are required but also optional fields of the types of all fields of type T.
type RequiredAll<T> = {
  [P in keyof T]-?: RequiredAll<T[P]>;
};

/*****************************************************************************/
/* Properties                                                                */
/*****************************************************************************/

// Note that the curve, settings, and internationalization are optional.
// A curve can be specified in three different ways:
// 1. only provide base information and get a random polynomial
// 2. additionally specify curve points to get a regression through these points
// 3. instead of points, specify the order of the polynomial and points are
//    randomly chosen
export interface Props {
  curve?: PropsBaseCurve | PropsCurvePoints | PropsCurveOrder | PropsCurveCoefficients;
  settings?: PropsSettings;
  internationalization?: PropsInternationalization;
  curveChange?: (value: CurveOut) => void;
}

// Mirror the `Props` from above but require all fields to be present (except the
// 'output callback').
export interface DefaultProps {
  curve: Required<PropsCurveOrder>;
  settings: Required<PropsSettings>;
  internationalization: RequiredAll<PropsInternationalization>;
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

export interface PropsCurveCoefficients extends PropsBaseCurve {
  coefficients: number[];
}

export interface PropsSettings {
  showCrosshair?: boolean;
  crosshairColor?: string;

  showCrosshairOnCurve?: boolean;
  crosshairOnCurveColor?: string;

  showDottedCurve?: boolean;

  curve?: CurveSettings;
  initialCurve?: CurveSettings;
  draggablePoint?: DraggablePointSettings;
  graph?: GraphSettings;
  svg?: SvgSettings;

  drawTitle?: boolean;
  drawGrid?: boolean;
  drawAxisLabels?: boolean;
  drawDraggablePoints?: boolean;

  graphOnly?: boolean;
}

export interface PropsInternationalization {
  common?: {
    determinationCoefficient?: string;
    resetZoom?: string;
  };
  curveSettings?: {
    title?: string;
    polynomialOrder?: { label?: string };
    xCoordinate?: { label?: string };
    yCoordinate?: { label?: string };
  };
  textSettings?: {
    title?: string;
    curveName?: { label?: string; placeholder?: string };
    xAxis?: { label?: string; placeholder?: string };
    yAxis?: { label?: string; placeholder?: string };
    description?: { label?: string; placeholder?: string };
  };
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

// ignore as there are no additional fields but a type with all optional fields
// being required is necessary
// eslint-disable-next-line
export interface Internationalization extends RequiredAll<PropsInternationalization> {}

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
  id: string;
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
