import * as d3 from 'd3';

import { DefaultProps, Props, PropsSettings, Settings, Size } from '../types';

/**
 * Generate the `Settings` for the react component based on the provided `props` and `defaultProps`.
 *
 * Any of the settings set in the `props` object are considered. If there is no value specifed in the
 * `props` object, the value is taken from the `defaultProps` object where there is always a value set.
 *
 * Some additional fields are set based on the previously defined settings to define the 'extra' settings
 * required by the `Settings` type.
 *
 * @param {Props} props the props passed to the react component
 * @param {DefaultProps} defaultProps the default props
 */
export const generateSettings = (props: Props, defaultProps: DefaultProps): Settings => {
  const settings = props?.settings;
  const defaultSettings = defaultProps.settings;

  const propsSettings: Required<PropsSettings> = {
    showCrosshair: settings?.showCrosshair || defaultSettings.showCrosshair,
    crosshairColor: settings?.crosshairColor || defaultSettings.crosshairColor,

    showCrosshairOnCurve: settings?.showCrosshairOnCurve || defaultSettings.showCrosshairOnCurve,
    crosshairOnCurveColor: settings?.crosshairOnCurveColor || defaultSettings.crosshairOnCurveColor,

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
      axis: {
        color: settings?.graph?.axis?.color || defaultSettings.graph.axis.color,
        labels: {
          color: settings?.graph?.axis?.labels?.color || defaultSettings.graph.axis.labels.color,
          fontFamily:
            settings?.graph?.axis?.labels?.fontFamily ||
            defaultSettings.graph.axis.labels.fontFamily,
          fontSize:
            settings?.graph?.axis?.labels?.fontSize || defaultSettings.graph.axis.labels.fontSize,
        },
        strokeWidth: settings?.graph?.axis?.strokeWidth || defaultSettings.graph.axis.strokeWidth,
      },
      grid: {
        color: settings?.graph?.grid?.color || defaultSettings.graph.grid.color,
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
      id: settings?.svg?.id || defaultSettings.svg.id,
      size: {
        width: settings?.svg?.size?.width || defaultSettings.svg.size.width,
        height: settings?.svg?.size?.height || defaultSettings.svg.size.height,
      },
    },

    drawTitle: settings?.drawTitle !== undefined ? settings?.drawTitle : defaultSettings.drawTitle,
    drawGrid: settings?.drawGrid !== undefined ? settings?.drawGrid : defaultSettings.drawGrid,
    drawAxisLabels:
      settings?.drawAxisLabels !== undefined
        ? settings?.drawAxisLabels
        : defaultSettings.drawAxisLabels,
    drawDraggablePoints:
      settings?.drawDraggablePoints !== undefined
        ? settings?.drawDraggablePoints
        : defaultSettings.drawDraggablePoints,

    graphOnly: settings?.graphOnly !== undefined ? settings?.graphOnly : defaultSettings.graphOnly,

    autoRescale:
      settings?.autoRescale != undefined ? settings?.autoRescale : defaultSettings.autoRescale,
  };

  // additional fields for the `Settings` type
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
  // NOTE: should be the same as the points of the regression have the same precision
  //       as the polynomial's coefficients
  const PRECISION_COEFFICIENT = 5;
  const PRECISION_POINTS = 5;

  return {
    ...propsSettings,

    graphSize: graphSize,
    precisionCoefficient: PRECISION_COEFFICIENT,
    precisionPoints: PRECISION_POINTS,
    xScale: d3.scaleLinear().rangeRound([0, graphSize.width]),
    yScale: d3.scaleLinear().rangeRound([graphSize.height, 0]),
  };
};
