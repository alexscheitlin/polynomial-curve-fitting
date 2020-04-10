/*****************************************************************************/
/* Properties                                                                */
/*****************************************************************************/

export interface Props {
  curve?: Curve;
  settings?: Settings;
}

// Mirrors the `Props` from above but requires all fields to be present.
export interface DefaultProps {
  curve: Required<Curve>;
  settings: Required<Settings>;
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

export interface Settings {
  curveDotsColor?: string;
  curveInitialColor?: string;
  curveLineColor?: string;
  draggableDotsColor?: string;
  graphMargin?: Margin;
  showDottedCurve?: boolean;
  svgSize?: Size;
}

/*****************************************************************************/
/* Helper Types                                                              */
/*****************************************************************************/
// These types should not have optional fields as they would become optional
// for the default props too.

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
