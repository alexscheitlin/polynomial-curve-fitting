import * as React from 'react';
import * as d3 from 'd3';
import regression from 'regression';

const D3Example = () => {
  /***************************************************************************/
  /* Settings                                                                */
  /***************************************************************************/
  // size of final SVG in pixel
  const SVG_SIZE = { width: 500, height: 300 };

  // margins of the graph (within the svg)
  const GRAPH_MARGIN = { top: 20, right: 20, bottom: 30, left: 50 };

  // ranges of the x and y axes
  const X_AXIS = { min: -5, max: 10 };
  const Y_AXIS = { min: -5, max: 10 };

  const SHOW_DOTTED_CURVE = false;
  const CURVE_LINE_COLOR = 'steelblue'; // visible if SHOW_DOTTED_CURVE == true
  const CURVE_DOTS_COLOR = 'red'; // visible if SHOW_DOTTED_CURVE === false
  const DRAGGABLE_DOTS_COLOR = 'navy';

  // precision (i.e., number of considered decimal places) of the
  // - polynomial's coefficients
  // - draggable points
  //
  // maybe this should be the same as the points of the regression have the
  // same precision as the polynomial's coefficients
  const PRECISION_COEFFICIENT = 4;
  const PRECISION_POINTS = 2;

  // initial order of the polynomial
  const startOrder = 2;

  // create random points based on the initial order
  const startPoints = generateRandomPoints(
    startOrder + 1,
    PRECISION_POINTS,
    X_AXIS.min,
    X_AXIS.max,
    Y_AXIS.min,
    Y_AXIS.max
  );

  /***************************************************************************/
  /* Drawing Methods                                                         */
  /***************************************************************************/

  // remove all drawings from svg
  const clearSVG = () => {
    d3.select('svg')
      .select('g')
      .remove();
    //.selectAll('*') // remove everything withing the svg tag (including the styling)
  };

  const drawCurvePoints = (d3, graph, x, y, curvePoints) => {
    // remove old points
    d3.select('svg')
      .select('g')
      .selectAll('ellipse')
      .remove();

    // draw new points
    graph
      .selectAll('ellipse')
      .data(curvePoints)
      .enter()
      .append('ellipse')
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('rx', 2.0)
      .attr('ry', 2.0)
      .style('fill', 'red');
  };

  const drawCurveLines = (d3, graph, line, curvePoints) => {
    // remove old lines
    d3.select('svg')
      .select('g')
      .selectAll('path#curve')
      .remove();

    // draw new lines
    graph
      .append('path')
      .datum(curvePoints)
      .attr('id', 'curve')
      .attr('fill', 'none')
      .attr('stroke', CURVE_LINE_COLOR)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('d', line);
  };

  const drawDraggablePoints = (graph, x, y, drag, points) => {
    // remove old points
    d3.select('svg')
      .select('g')
      .selectAll('circle')
      .remove();

    graph
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('r', 8.0)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .style('cursor', 'pointer');

    // add drag behaviour to all draggable points
    graph.selectAll('circle').call(drag);
  };

  const addCrossHair = (d3, graph, x, y, width, height) => {
    // based on
    // https://stackoverflow.com/questions/38687588/add-horizontal-crosshair-to-d3-js-chart
    const color = 'lightgray';
    const lineWidth = 1.0;
    const dashes = '3 3'; // width of one dash and space between two dashes

    const transpRect = graph
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0);

    const verticalLine = graph
      .append('line')
      .attr('opacity', 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    const horizontalLine = graph
      .append('line')
      .attr('opacity', 0)
      .attr('x1', 0)
      .attr('x2', width)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    const text = graph
      .append('text')
      .attr('opacity', 0)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dx', '.5em')
      .attr('dy', '1em')
      .attr('font-size', '0.75rem')
      .attr('fill', 'gray');

    transpRect
      .on('mousemove', function() {
        const mouse = d3.mouse(this);
        const mouseX = mouse[0];
        const mouseY = mouse[1];
        verticalLine
          .attr('x1', mouseX)
          .attr('x2', mouseX)
          .attr('opacity', 1);
        horizontalLine
          .attr('y1', mouseY)
          .attr('y2', mouseY)
          .attr('opacity', 1);
        text
          .attr('x', d => mouseX)
          .attr('y', d => mouseY)
          .text(() => `x: ${round(x.invert(mouseX), 2)}, y: ${round(y.invert(mouseY), 2)}`)
          .attr('opacity', 1);
      })
      .on('mouseout', function() {
        verticalLine.attr('opacity', 0);
        horizontalLine.attr('opacity', 0);
        text.attr('opacity', 0);
      });
  };

  const drawCurveName = (graph, value) => {
    // set new text
    graph.select('text#curve-name').text(value);

    // get text length
    const element = document.getElementById('curve-name');
    const textLength = element.getComputedTextLength();

    // re-position text
    graph
      .select('text#curve-name')
      .attr('y', 0)
      .attr('x', (SVG_SIZE.width - element.getComputedTextLength()) / 2 - GRAPH_MARGIN.left);
  };

  const drawXAxisLabel = (svg, value) => svg.select('text#x-axis-label').text(value);

  const drawYAxisLabel = (svg, value) => svg.select('text#y-axis-label').text(value);

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  const SVG_REF = React.useRef();
  const [order, setOrder] = React.useState(startOrder);
  const [points, setPoints] = React.useState(startPoints);
  const [curvePoints, setCurvePoints] = React.useState(
    generateCurvePoints(points, order, X_AXIS.min, X_AXIS.max, PRECISION_COEFFICIENT)
  );
  const [coefficients, setCoefficients] = React.useState(
    polynomialRegression(points, order, PRECISION_COEFFICIENT).equation
  );
  const [equation, setEquation] = React.useState(
    polynomialRegression(points, order, PRECISION_COEFFICIENT).string
  );
  const [r2, setR2] = React.useState(polynomialRegression(points, order, PRECISION_COEFFICIENT).r2);
  const [drawing, setDrawing] = React.useState({}); // most likely, this is not best practice

  const [curveName, setCurveName] = React.useState('');
  const [xAxisLabel, setXAxisLabel] = React.useState('');
  const [yAxisLabel, setYAxisLabel] = React.useState('');

  React.useEffect(() => init(), [order]);

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const init = () => {
    // implementation based on:
    // https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

    // define svg and link it with the dom element
    const svg = d3.select(SVG_REF.current);

    // define size of graph
    const graphWidth = +svg.attr('width') - GRAPH_MARGIN.left - GRAPH_MARGIN.right;
    const graphHeight = +svg.attr('height') - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom;

    // define range of x and y axis (in pixel)
    const x = d3.scaleLinear().rangeRound([0, graphWidth]);
    const y = d3.scaleLinear().rangeRound([graphHeight, 0]);

    // set position of x and y axis
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    // define how lines should be drawn
    const line = d3
      .line()
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    // define drag events (methods are defined at the end)
    const drag = d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    // // configure svg
    // svg
    //   .append('rect')
    //   .attr('cursor', 'default')
    //   .attr('fill', 'none')
    //   .attr('pointer-events', 'all')
    //   .attr('width', graphWidth)
    //   .attr('height', graphHeight)
    //   .attr('transform', 'translate(' + GRAPH_MARGIN.left + ',' + GRAPH_MARGIN.top + ')');

    // append graph as 'group' element to the svg and move it to the top left margin
    const graph = svg
      .append('g')
      .attr('id', 'graph')
      .attr('transform', 'translate(' + GRAPH_MARGIN.left + ',' + GRAPH_MARGIN.top + ')');

    // set domains of x and y axis
    x.domain([X_AXIS.min, X_AXIS.max]);
    y.domain([Y_AXIS.min, Y_AXIS.max]);

    // draw x axis
    graph
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + graphHeight + ')')
      .call(xAxis);

    // draw y axis
    graph
      .append('g')
      .attr('class', 'axis axis--y')
      .call(yAxis);

    addCrossHair(d3, graph, x, y, graphWidth, graphHeight);

    // draw initial curve
    graph
      .append('path')
      .datum(curvePoints)
      .attr('id', 'initial') // id is currently not used
      .attr('fill', 'none')
      .attr('stroke', 'lightgray')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1)
      .attr('d', line);

    // draw curve points or lines
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(d3, graph, x, y, curvePoints);
    } else {
      drawCurveLines(d3, graph, line, curvePoints);
    }

    // 1. create draggable points that need to be of type 'circle' so that the
    //    dragging events are correctly added
    // 2. add drag behaviour to all draggable points
    drawDraggablePoints(graph, x, y, drag, points);
    graph.selectAll('circle').call(drag);

    // most likely, this is not best practice
    // (these variables are needed for `handlePointCoordinateChange`)
    setDrawing({
      d3: d3,
      svg: svg,
      graph: graph,
      x: x,
      y: y,
      drag: drag,
      line: line,
    });

    // draw curve name
    graph
      .append('text')
      .attr('id', 'curve-name')
      .attr('font-size', '0.75rem')
      .attr('fill', 'black');
    drawCurveName(graph, curveName);

    // text label for the x axis
    // https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
    svg
      .append('text')
      .attr('id', 'x-axis-label')
      .attr(
        'transform',
        'translate(' +
          graphWidth / 2 +
          ' ,' +
          (graphHeight + GRAPH_MARGIN.top + GRAPH_MARGIN.bottom) +
          ')'
      )
      .style('text-anchor', 'middle')
      .text(xAxisLabel);

    // text label for the y axis
    svg
      .append('text')
      .attr('id', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0)
      .attr('x', 0 - graphHeight / 2)
      .attr('dy', '1.5rem')
      .style('text-anchor', 'middle')
      .text(yAxisLabel);

    function dragstarted(d) {
      d3.select(this)
        .raise()
        .classed('active', true);
    }

    function dragged(d) {
      // change coordinate of points
      d[0] = round(x.invert(d3.event.x), PRECISION_POINTS);
      d[1] = round(y.invert(d3.event.y), PRECISION_POINTS);

      // update location of point
      d3.select(this)
        .attr('cx', x(d[0]))
        .attr('cy', y(d[1]));

      const regression = polynomialRegression(points, order, PRECISION_COEFFICIENT);
      setCoefficients(regression.equation);
      setEquation(regression.string);
      setR2(regression.r2);

      const newCurvePoints = generateCurvePoints(
        points,
        order,
        X_AXIS.min,
        X_AXIS.max,
        PRECISION_COEFFICIENT
      );
      setCurvePoints(newCurvePoints);

      // sort points to not have "invalid" functions
      setPoints(sortPointsByX(points));

      if (SHOW_DOTTED_CURVE) {
        drawCurvePoints(d3, graph, x, y, newCurvePoints);
      } else {
        drawCurveLines(d3, graph, line, newCurvePoints);
      }
    }

    function dragended(d) {
      d3.select(this).classed('active', false);

      // re-draw draggable points
      drawDraggablePoints(graph, x, y, drag, points);
    }
  };

  const updateOrder = event => {
    const newOrder = parseInt(event.target.value);

    // add or remove points until there is one more point than the new order
    let cPoints = deepCopy(points);
    while (cPoints.length - 1 != newOrder) {
      cPoints.length - 1 < newOrder && addPoint(cPoints, PRECISION_COEFFICIENT, PRECISION_POINTS);
      cPoints.length - 1 > newOrder && removePoint(cPoints);
    }

    clearSVG();

    setPoints(sortPointsByX(cPoints));
    setOrder(newOrder);
  };

  const handlePointCoordinateChange = (event, pointIndex, coordinateIndex) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || parseFloat(value) === NaN) {
      value = 0;
    }

    // update changed coordinate in points list
    const newPoints = [...points];
    newPoints[pointIndex][coordinateIndex] = parseFloat(value);
    setPoints(newPoints);

    // calculate new curve points and re-draw curve (dotted or lined)
    const newCurvePoints = generateCurvePoints(
      points,
      order,
      X_AXIS.min,
      X_AXIS.max,
      PRECISION_COEFFICIENT
    );
    setCurvePoints(newCurvePoints);
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(drawing.d3, drawing.graph, drawing.x, drawing.y, newCurvePoints);
    } else {
      drawCurveLines(drawing.d3, drawing.graph, drawing.line, newCurvePoints);
    }

    // re-draw draggable points
    drawDraggablePoints(drawing.graph, drawing.x, drawing.y, drawing.drag, points);

    // re-compute regression
    const regression = polynomialRegression(points, order, PRECISION_COEFFICIENT);
    setCoefficients(regression.equation);
    setEquation(regression.string);
    setR2(regression.r2);
  };

  const handleCurveCoefficientChange = (event, coefficientIndex) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || parseFloat(value) === NaN) {
      value = 0;
    }

    // update coefficient list (don't update state yet)
    const newCoefficients = [...coefficients];
    newCoefficients[coefficientIndex] = parseFloat(value);

    // calculate new y values for the x values
    const newPoints = [...points].map(point => {
      point[1] = round(polynomialValue(point[0], newCoefficients), PRECISION_POINTS);
      return point;
    });
    setPoints(newPoints);

    // calculate new curve points and re-draw curve (dotted or lined)
    const newCurvePoints = generateCurvePoints(
      points,
      order,
      X_AXIS.min,
      X_AXIS.max,
      PRECISION_COEFFICIENT
    );
    setCurvePoints(newCurvePoints);
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(drawing.d3, drawing.graph, drawing.x, drawing.y, newCurvePoints);
    } else {
      drawCurveLines(drawing.d3, drawing.graph, drawing.line, newCurvePoints);
    }

    // re-draw draggable points
    drawDraggablePoints(drawing.graph, drawing.x, drawing.y, drawing.drag, newPoints);

    // re-compute regression
    const regression = polynomialRegression(newPoints, order, PRECISION_COEFFICIENT);
    setCoefficients(regression.equation);
    setEquation(regression.string);
    setR2(regression.r2);

    // TODO: be sure to not enter an endless loop :/
  };

  const handleCurveNameChange = event => {
    const value = event.target.value;
    setCurveName(value);
    drawCurveName(drawing.graph, value);
  };

  const handleXAxisLabelChange = event => {
    const value = event.target.value;
    setXAxisLabel(value);
    drawXAxisLabel(drawing.svg, value);
  };

  const handleYAxisLabelChange = event => {
    const value = event.target.value;
    setYAxisLabel(value);
    drawYAxisLabel(drawing.svg, value);
  };

  return (
    <div style={{ display: 'flex' }}>
      <svg ref={SVG_REF} width={SVG_SIZE.width} height={SVG_SIZE.height} style={{ float: 'left' }}>
        <defs>
          <style type="text/css">{`
            circle {
              fill: ${DRAGGABLE_DOTS_COLOR};
            }
            circle.active {
              fill: gray;
              stroke: black;
            }
          `}</style>
        </defs>
      </svg>
      <div>
        <div>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={curveName}
              onChange={e => handleCurveNameChange(e)}
              placeholder="Curve Name"
            />
          </div>
          <div>
            <label>X-Axis:</label>
            <input
              type="text"
              value={xAxisLabel}
              onChange={e => handleXAxisLabelChange(e)}
              placeholder="TODO"
            />
          </div>
          <div>
            <label>Y-Axis:</label>
            <input
              type="text"
              value={yAxisLabel}
              onChange={e => handleYAxisLabelChange(e)}
              placeholder="TODO"
            />
          </div>
        </div>
        <hr></hr>
        <select onChange={updateOrder} value={order}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
        <hr></hr>
        <pre>
          <div style={{ color: r2 === 1 ? 'green' : 'red' }}>
            Coefficient of Determination (R^2): {JSON.stringify(r2)}
          </div>
        </pre>
        <hr></hr>
        <div>
          <pre>
            <div>Coeffs: {`  y = ${generatePolynomialEquation(coefficients)}`}</div>
            <div>Equation: {equation}</div>
          </pre>
          <span>{'y = '}</span>
          {coefficients.map((coefficient, i) => {
            return (
              <span key={i}>
                {
                  <input
                    className="number"
                    type="number"
                    step={Math.pow(10, -(PRECISION_COEFFICIENT - 1))}
                    value={coefficient}
                    onChange={e => handleCurveCoefficientChange(e, i)}
                  />
                }
                {coefficients.length - i - 1 > 1
                  ? ' * x^' + (coefficients.length - i - 1).toString()
                  : ''}
                {coefficients.length - i - 1 === 1 ? ' * x' : ''}
                {i < coefficients.length - 1 ? ' + ' : ''}
              </span>
            );
          })}
        </div>
        <hr></hr>
        <div>
          {points.map((point, i) => {
            return (
              <div key={i}>
                P{i + 1} - x:{' '}
                <input
                  className="number"
                  type="number"
                  min="0"
                  max={X_AXIS.max}
                  step={Math.pow(10, -(PRECISION_POINTS - 1))}
                  value={point[0]}
                  onChange={e => handlePointCoordinateChange(e, i, 0)}
                />{' '}
                y:{' '}
                <input
                  className="number"
                  type="number"
                  min="0"
                  max={Y_AXIS.max}
                  step={Math.pow(10, -(PRECISION_POINTS - 1))}
                  value={point[1]}
                  onChange={e => handlePointCoordinateChange(e, i, 1)}
                />
                <style>{`
                  .number {
                    width: 75px;
                    height: 35px;
                  }
                `}</style>
              </div>
            );
          })}
        </div>
        <hr></hr>
      </div>
    </div>
  );
};

export default D3Example;

/*****************************************************************************/
/* Polynomial Regression with linear least-squares                           */
/*                                                                           */
/* made with https://github.com/Tom-Alexander/regression-js                  */
/*****************************************************************************/
//import regression from 'regression';

/**
 * Fits the `points` to a polynomial curve with the given `order` with the
 * equation `a_n*x^n ... + a_1*x + a_0`.
 *
 * The coefficients `a_n` have `precision` number of decimal places.
 *
 * Example:
 * https://github.com/Tom-Alexander/regression-js#regressionpolynomialdata-options
 *
 * @param {number[][]} points
 * @param {number} order
 * @param {number} precision
 */
const polynomialRegression = (points, order, precision) =>
  regression.polynomial(points, { order: order, precision: precision });

/**
 * Generate evenly distributed points between `xMin` and `xMax` on a polynomial
 * curve with the given `order`.
 *
 * The polynomial is created using linear least-squares regression with the
 * provided `points`. The coefficients of the polynomial have `precision`
 * number of decimal places.
 *
 * @param {number[][]} points
 * @param {number} order
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} precision
 * @returns {number[][]}
 */
const generateCurvePoints = (points, order, xMin, xMax, precision) => {
  // TODO: check precision of output points (if it is the same as `precision`,
  // then the precision constants of the points and coefficients need to be
  // the same)
  const frequency = 7;
  const xLength = xMax - xMin;
  const regression = polynomialRegression(points, order, precision);
  return range(frequency * xLength + 1)
    .map(x => x / frequency + xMin)
    .map(x => regression.predict(x));
};

/*****************************************************************************/
/* Utils                                                                     */
/*****************************************************************************/

/**
 * Deep copy an object.
 *
 * @param {any} x
 * @returns {any}
 */
const deepCopy = x => JSON.parse(JSON.stringify(x));

/**
 * Round the number `n` to `p` decimal places.
 *
 * Example:
 * `(7.128, 2)` => `7.13`
 *
 * @param {number} n
 * @param {number} p
 * @returns {number}
 */
const round = (n, p) => {
  const m = Math.pow(10, p);
  return Math.round(n * m) / m;
};

/**
 * Create a range of `n` numbers starting from `0` up to `n-1`.
 *
 * Example:
 * `(5)` => `[0, 1, 2, 3, 4]`
 *
 * @param {number} n
 * @returns {number[]}
 */
const range = n => [...Array(n).keys()];

/**
 * Create `n` points that are evenly distributed between `xMin` and `xMax` and
 * have random y values between `yMin` and `yMax`.
 *
 * The x-coordinate of the first point is `0` and the x-coordinate of the last
 * point is `xMax`. The y-coordinate is a random value between `0` and yMax`.
 * All coordinates have `p` decimal places.
 *
 * Example:
 * `(3, 2, -10, 10, -10, 10)` => `[[-10, -5.02], [0, 6.5], [10, -4.91]]
 *
 * @param {number} n the number of points to generate
 * @param {number} p the precision of the coordinates (i.e., the number of decimal places)
 * @param {number} xMin the minimum value of the x axis (needs to be smaller than `xMax`)
 * @param {number} xMax the maximum value of the x axis (needs to be greater than `xMin`)
 * @param {number} yMin the minimum value of the y axis (needs to be smaller than `yMax`)
 * @param {number} yMax the maximum value of the y axis (needs to be greater than `yMin`)
 * @returns {number[][]}
 */
const generateRandomPoints = (n, p, xMin, xMax, yMin, yMax) => {
  const xLength = xMax - xMin;
  const yLength = yMax - yMin;

  // get array with `n` elements from `0` to `n-1`
  return (
    range(n)
      // get points with `x` eqaully distributed between `0` and `xLength` and `y` being a
      // random value between `0` and `yLength`
      .map(i => [(xLength / (n - 1)) * i, Math.random() * yLength])
      // shift `x` and `y` values acording to `xMin` and `yMin`
      .map(point => [point[0] + xMin, point[1] + yMin])
      // round `y` value to precision `p`
      .map(point => [point[0], round(point[1], p)])
  );
};

/**
 * Sort the provided `points` by their x values.
 *
 * The sorting does not happen in-place. A shallow (but NO deep) copy of the
 * array is created, sorted, and returned.
 * @param {number[][]} points Points with `x` and `y` values as first and
 *                            second array items (e.g, `x,y` = `3,4` =>
 *                            `[3, 4]`).
 * @returns {number[][]}
 */
const sortPointsByX = points => [...points].sort((a, b) => a[0] - b[0]);

/**
 * Remove the second point from the list of `points` in-place and return the
 * removed item. If there is no second item to be removed, `false` is returned.
 *
 * Examples:
 * - `([[0, 1], [4, 2], [3,5]])` => `[4, 2]`
 * - `([[0, 1]])` => `false`
 *
 * @param {any} points
 */
const removePoint = points => points.length > 1 && points.splice(1, 1);

// TODO: properly check whether this works with negative coordinates
/**
 * Insert a new point (lying on a curve) into the provided list of `points`
 * (in-place).
 *
 * The curve is a polynomial generated using linear least-squares regression
 * with the provided `points`. The coefficients of the polynomial have
 * `coefficientPrecision` number of decimal places. The inserted point
 * has `pointsPrecision` number of decimal places.
 *
 * @param {number[][]} points
 * @param {number} coefficientPrecision
 * @param {number} pointsPrecision
 */
const addPoint = (points, coefficientPrecision, pointsPrecision) => {
  // get max difference on x axis between neighboring points
  const maxDiff = Math.max(...points.map((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0])));

  // the x coordinate of the point to insert shall be between the two points
  // having the largest distance (centered)
  // => get the new x value
  const newX =
    points.find((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0]) === maxDiff)[0] + maxDiff / 2;

  // based on the already existing points, make a linear least-squares
  // regression and get the corresponding y coordinate to the just
  // computed x coordinate
  const newY = polynomialRegression(points, points.length - 1, coefficientPrecision).predict(
    newX
  )[1];

  // insert new point into the list of points and sort the list by the point's
  // x-coordinate
  points.push([round(newX, pointsPrecision), round(newY, pointsPrecision)]);
  points = sortPointsByX(points);
};

/**
 * Given the `x` value, calculate the corresponding `y` value on the polynomial
 * defined by the provided `coefficients`.
 *
 * Example:
 * `(2, [-1, 2, 1])` => `1` | polynomial: *y = -x^2 + 2x + 1*
 *
 * @param {number} x
 * @param {number[]} coefficients
 * @returns {number}
 */
const polynomialValue = (x, coefficients) =>
  coefficients.map((c, i) => c * Math.pow(x, coefficients.length - i - 1)).reduce((a, b) => a + b);

/**
 * Generate the polynomial equation given the polynomial's `coefficients`.
 *
 * Example:
 * `[3,-2,1]` => `3*x^2 - 2*x + 1`
 *
 * @param {number[]} coefficients
 * @returns {string}
 */
const generatePolynomialEquation = coefficients =>
  coefficients
    .map((coefficient, index) => {
      // polynomial (poly: many, nomial: terms)
      // polynomial:    -4*x^2 + 3*x - 0.5
      // terms:         -4*x^2,  3*x, -0.5
      // coefficients:      -4,    3, -0.5
      // signs:              -,    +,    -
      // exponents:          2,    1,    0
      // variable:                       x

      const variable = 'x';
      const exponent = coefficients.length - index - 1;

      let sign = '';
      // - only use spaces if it is not the first term
      // - do not show a '+' if it is the first term
      // - do not show a '+' or spaces for a '-' if all terms before have a
      //   coefficient of value '0' and therefore are not shown
      const anyTermShownBefore =
        coefficients.slice(0, index).reduce((a, b) => Math.abs(a) + Math.abs(b), []) !== 0;
      if (coefficient >= 0) {
        sign = index === 0 || !anyTermShownBefore ? '' : ' + ';
      } else {
        sign = index === 0 || !anyTermShownBefore ? '-' : ' - ';
      }

      let variablePart = ''; // x^0 => ''
      if (exponent > 1) {
        // x^2, x^3, x^4, ...
        variablePart = `*${variable}^` + exponent.toString();
      } else if (exponent === 1) {
        // x^1 => x
        variablePart = `${variable}`;
      }

      let coefficientPart = Math.abs(coefficient);
      // do not show a '1' as coefficient if there is a variable coming
      if (coefficientPart === 1 && variablePart != '') {
        coefficientPart = '';
      }

      return coefficientPart !== 0 ? `${sign}${coefficientPart}${variablePart}` : '';
    })
    .join('');
