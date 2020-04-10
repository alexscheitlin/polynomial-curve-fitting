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
    crosshairColor: 'gray',

    // whether the curve should be plotted as dots or not (= as a continuous line)
    showDottedCurve: false,

    // curve resulting from the least squares regression through the draggable points
    curve: {
      color: 'steelblue',
      strokeWidth: 1.5,
    },

    // curve (always a continuous line) throught the initial points
    initialCurve: {
      color: 'gray',
      strokeWidth: 1,
    },

    // points that can be dragged and are used for the least suqares regression to get the polynomial curve
    draggablePoint: {
      color: 'navy',
      radius: 8.0,
    },

    // element within the svg that contains the coordinatesystem, curves, and draggable points
    // title and axis labels are located relative to the graph but are directly drawn on the svg
    graph: {
      axis: {
        color: 'black',
        labels: {
          color: 'black',
          fontFamily: 'sans-serif',
          fontSize: 0.8, // rem
        },
        strokeWidth: 2.0,
      },

      grid: {
        color: 'lightgray',
      },

      // margin of the graph (within the svg) in pixel
      margin: { top: 30, right: 20, bottom: 50, left: 50 },
      title: {
        color: 'black',
        fontFamily: 'sans-serif',
        fontSize: 1.0, // rem
      },
    },

    svg: {
      // size of the final SVG in pixel
      size: { width: 750, height: 450 },
    },
  },
};
