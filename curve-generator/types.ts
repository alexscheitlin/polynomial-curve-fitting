export interface Axis {
  label: string;
  min?: number;
  max?: number;
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

export interface Curve {
  name: string;
  description: string;
  xAxis: Axis;
  yAxis: Axis;
  polynomialOrder: number;
}

export interface Settings {
  curveDotsColor: string;
  curveInitialColor: string;
  curveLineColor: string;
  draggableDotsColor: string;
  graphMargin: Margin;
  showDottedCurve: boolean;
  svgSize: Size;
}
