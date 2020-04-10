import * as d3 from 'd3';
import { DefaultProps, Props, PropsSettings, Settings, Size } from './types';

/**
 * Generate the `Settings` for the react component based on the provided `props` and `defaultProps`.
 *
 * Any of the settings set in the `props` object are considered. If there is no value specifed in the
 * `props` object, the value is taken from the `defaultProps` object where there is always a value set.
 *
 * Some additional settings are computed based on the previously defined settings to define the 'extra'
 * settings required by the `Settings` type.
 *
 * @param {Props} props the props passed to the react component
 * @param {DefaultProps} defaultProps the default props
 */
export const generateSettings = (props: Props, defaultProps: DefaultProps): Settings => {
  const settings = props?.settings;
  const defaultSettings = defaultProps.settings;

  const propsSettings: Required<PropsSettings> = {
    // props settings
    crosshairColor: settings?.crosshairColor || defaultSettings.crosshairColor,
    showDottedCurve: settings?.showDottedCurve || defaultSettings.showDottedCurve,

    curve: {
      color: settings?.curve?.color || defaultSettings.curve.color,
      strokeWidth: settings?.curve?.strokeWidth || defaultSettings.curve.strokeWidth,
    },
    initialCurve: {
      color: settings?.initialCurve?.color || defaultSettings.initialCurve.color,
      strokeWidth: settings?.initialCurve?.strokeWidth || defaultSettings.initialCurve.strokeWidth,
    },
    draggablePoint: {
      color: settings?.draggablePoint?.color || defaultSettings.draggablePoint.color,
      radius: settings?.draggablePoint?.radius || defaultSettings.draggablePoint.radius,
    },
    graph: {
      axisLabels: {
        color: settings?.graph?.axisLabels?.color || defaultSettings.graph.axisLabels.color,
        fontFamily:
          settings?.graph?.axisLabels?.fontFamily || defaultSettings.graph.axisLabels.fontFamily,
        fontSize:
          settings?.graph?.axisLabels?.fontSize || defaultSettings.graph.axisLabels.fontSize,
      },
      margin: {
        top: settings?.graph?.margin?.top || defaultSettings.graph.margin.top,
        right: settings?.graph?.margin?.right || defaultSettings.graph.margin.right,
        bottom: settings?.graph?.margin?.bottom || defaultSettings.graph.margin.bottom,
        left: settings?.graph?.margin?.left || defaultSettings.graph.margin.left,
      },
      title: {
        color: settings?.graph?.title?.color || defaultSettings.graph.title.color,
        fontFamily: settings?.graph?.title?.fontFamily || defaultSettings.graph.title.fontFamily,
        fontSize: settings?.graph?.title?.fontSize || defaultSettings.graph.title.fontSize,
      },
    },
    svg: {
      size: {
        width: settings?.svg?.size?.width || defaultSettings.svg.size.width,
        height: settings?.svg?.size?.height || defaultSettings.svg.size.height,
      },
    },
  };

  // additional settings
  const graphSize: Size = {
    width:
      propsSettings.svg.size.width -
      propsSettings.graph.margin.left -
      propsSettings.graph.margin.right,
    height:
      propsSettings.svg.size.height -
      propsSettings.graph.margin.top -
      propsSettings.graph.margin.bottom,
  };

  // precision (i.e., number of considered decimal places) of the
  // - polynomial's coefficients
  // - draggable points
  //
  // TODO: maybe this should be the same as the points of the regression have the
  //       same precision as the polynomial's coefficients
  // TODO: this should maybe be a prop or adjusted dynamically (to fit best fit the
  //       curve according to R^2)
  const PRECISION_COEFFICIENT = 4;
  const PRECISION_POINTS = 2;

  return {
    ...propsSettings,

    graphSize: graphSize,
    precisionCoefficient: PRECISION_COEFFICIENT,
    precisionPoints: PRECISION_POINTS,
    xScale: d3.scaleLinear().rangeRound([0, graphSize.width]),
    yScale: d3.scaleLinear().rangeRound([graphSize.height, 0]),
  };
};
