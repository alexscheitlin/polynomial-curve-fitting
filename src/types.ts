/*****************************************************************************/
/* Properties                                                                */
/*****************************************************************************/

export interface Props {
  curve?: Curve;
  settings?: PropsSettings;
}

// Mirrors the `Props` from above but requires all fields to be present.
export interface DefaultProps {
  curve: Required<Curve>;
  settings: Required<PropsSettings>;
}

/*****************************************************************************/
/* Main Types                                                                */
/*****************************************************************************/

export interface Curve {
  name?: string;
  description?: string;
  xAxis?: Axis;
  yAxis?: Axis;
  polynomialOrder?: number;
}

// Settings that can be provided via props.
export interface PropsSettings {
  crosshairColor?: string;
  showDottedCurve?: boolean;

  curve?: CurveSettings;
  initialCurve?: CurveSettings;
  draggablePoint?: DraggablePointSettings;
  graph?: GraphSettings;
  svg?: SvgSettings;
}

// Extended `PropsSettings` that require all fields to be set and contain some
// additional fields based on the provided settings.
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

export interface CurveSettings {
  color: string;
  strokeWidth: number;
}

export interface DraggablePointSettings {
  color: string;
  radius: number;
}

export interface GraphSettings {
  axisLabels: TextSettings;
  margin: Margin;
  title: TextSettings;
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
