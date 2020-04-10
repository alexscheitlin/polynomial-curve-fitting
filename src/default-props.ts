import { DefaultProps } from './types';

export const defaultProps: DefaultProps = {
  curve: {
    name: 'Random Polynomial',
    description: 'This is some random polynomial.',
    xAxis: { min: -5, max: 10, label: 'x Values' },
    yAxis: { min: -5, max: 10, label: 'y Values' },

    // the order of the polynomial to plot
    polynomialOrder: 3,
  },
  settings: {
    // size of the final SVG in pixel
    svgSize: { width: 750, height: 450 },

    // margin of the graph (within the svg) in pixel
    graphMargin: { top: 30, right: 20, bottom: 30, left: 50 },

    // whether the curve should be plotted as dots or not (= as a continuous line)
    showDottedCurve: false,

    // color of the curve if `showDottedCurve` === true
    curveLineColor: 'steelblue',

    // color of the curve if `showDottedCurve` === false
    curveDotsColor: 'red',

    // color of the initial curve (always a continuous line)
    curveInitialColor: 'gray',

    // color of the draggable points on the curve
    draggableDotsColor: 'navy',
  },
};
