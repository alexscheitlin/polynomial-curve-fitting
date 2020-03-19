import * as React from 'react';
import * as d3 from 'd3';
import regression from 'regression';

// polynomial regression made with
// https://github.com/Tom-Alexander/regression-js

// round n to x decimal places
const round = (n, p) => {
  const x = p;
  const y = Math.pow(10, x);
  return Math.round(n * y) / y;
};

// calculate the y value to the given x value using the polynomial defined by
// the provided coefficients
// e.g. (2, [-1, 2, 1]) => 1 // polynomial: y = -x^2 + 2x + 1
const polynomialCallback = (x, coefficients) =>
  coefficients.map((c, i) => c * Math.pow(x, coefficients.length - i - 1)).reduce((a, b) => a + b);

// given the coefficients of a polynomial, construct its equation
// e.g. [3,-2,1] => 3*x^2 - 2*x + 1
const constructPolynomialEquation = coefficients =>
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

const D3Example = () => {
  /***************************************************************************/
  /* Settings                                                                */
  /***************************************************************************/
  // size of final SVG in pixel
  const SVG_SIZE = { width: 500, height: 300 };

  // max values of both axis
  const X_MAX = 10;
  const Y_MAX = 10;

  const SHOW_DOTTED_CURVE = false;

  // precision (i.e., number of significant figures) of the
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
  const startPoints = d3
    .range(0, startOrder + 1)
    .map(i => [(X_MAX / startOrder) * i, round(Math.random() * Y_MAX, PRECISION_POINTS)]);

  /***************************************************************************/
  /* Methods                                                                 */
  /***************************************************************************/

  // in place sorting of points by x coordinate
  const sortPointsByX = points => points.sort((a, b) => a[0] - b[0]);

  // polynomial regression for given points of desired order
  const polynomialRegression = (points, order) =>
    regression.polynomial(points, { order: order, precision: PRECISION_COEFFICIENT });

  // calculate "many" points lying on the polynomial generated be using
  // polynomial regressions
  const calculateCurvePoints = (points, order) => {
    const frequency = 7;
    const regression = polynomialRegression(points, order);
    return [...Array(frequency * X_MAX + 1).keys()]
      .map(x => x / frequency)
      .map(x => regression.predict(x));
  };

  // remove point from points array (in place)
  const removePoint = points => points.splice(1, 1);

  // add point to points array (in place)
  const addPoint = points => {
    // 1. get max difference on x axis between neighboring points
    // 2. x coordinate of point to insert shall be between the two
    //    points having the largest distance (centered)
    // 3. based on the already existing points, make a polynomial
    //    regression and get the y coordinate of the just computed
    //    x value
    const maxDiff = Math.max(...points.map((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0])));
    const newX =
      points.find((p, i) => Math.abs(p[0] - (points[i + 1] || p)[0]) === maxDiff)[0] + maxDiff / 2;
    const newY = polynomialRegression(points, points.length).predict(newX)[1];

    points.push([round(newX, PRECISION_POINTS), round(newY, PRECISION_POINTS)]);
    sortPointsByX(points);
  };

  // remove all drawings from svg
  const clearSVG = () => {
    d3.select('svg')
      .select('g')
      .remove();
    //.selectAll('*') // remove everything withing the svg tag (including the styling)
  };

  const drawCurvePoints = (d3, focus, x, y, curvePoints) => {
    // remove old points
    d3.select('svg')
      .select('g')
      .selectAll('ellipse')
      .remove();

    // draw new points
    focus
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

  const drawCurveLines = (d3, focus, line, curvePoints) => {
    // remove old lines
    d3.select('svg')
      .select('g')
      .selectAll('path#curve')
      .remove();

    // draw new lines
    focus
      .append('path')
      .datum(curvePoints)
      .attr('id', 'curve')
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('d', line);
  };

  const drawDraggablePoints = (focus, x, y, drag, points) => {
    // remove old points
    d3.select('svg')
      .select('g')
      .selectAll('circle')
      .remove();

    focus
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('r', 8.0)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .style('cursor', 'pointer');

    // add drag behaviour to all draggable points
    focus.selectAll('circle').call(drag);
  };

  const addCrossHair = (d3, focus, width, height) => {
    // based on
    // https://stackoverflow.com/questions/38687588/add-horizontal-crosshair-to-d3-js-chart
    const color = 'lightgray';
    const lineWidth = 1.0;
    const dashes = '3 3'; // width of one dash and space between two dashes

    const transpRect = focus
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0);

    var verticalLine = focus
      .append('line')
      .attr('opacity', 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    var horizontalLine = focus
      .append('line')
      .attr('opacity', 0)
      .attr('x1', 0)
      .attr('x2', width)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    transpRect
      .on('mousemove', function() {
        let mouse = d3.mouse(this);
        let mousex = mouse[0];
        let mousey = mouse[1];
        verticalLine
          .attr('x1', mousex)
          .attr('x2', mousex)
          .attr('opacity', 1);
        horizontalLine
          .attr('y1', mousey)
          .attr('y2', mousey)
          .attr('opacity', 1);
      })
      .on('mouseout', function() {
        verticalLine.attr('opacity', 0);
        horizontalLine.attr('opacity', 0);
      });
  };

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  const SVG_REF = React.useRef();
  const [order, setOrder] = React.useState(startOrder);
  const [points, setPoints] = React.useState(startPoints);
  const [curvePoints, setCurvePoints] = React.useState(calculateCurvePoints(points, order));
  const [coefficients, setCoefficients] = React.useState(
    polynomialRegression(points, order).equation
  );
  const [equation, setEquation] = React.useState(polynomialRegression(points, order).string);
  const [r2, setR2] = React.useState(polynomialRegression(points, order).r2);
  const [drawing, setDrawing] = React.useState({}); // most likely, this is not best practice

  React.useEffect(() => init(), [order]);

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const init = () => {
    // implementation based on:
    // https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

    // define svg and link it with the dom element
    const svg = d3.select(SVG_REF.current);

    // define svg properties
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;

    // define range of x and y axis (in pixel)
    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);

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

    // configure svg
    svg
      .append('rect')
      .attr('class', 'zoom')
      .attr('cursor', 'default')
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // create "drawing area" on svg
    let focus = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // set domains of x and y axis
    x.domain([0, X_MAX]);
    y.domain([0, Y_MAX]);

    // draw x axis
    focus
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    // draw y axis
    focus
      .append('g')
      .attr('class', 'axis axis--y')
      .call(yAxis);

    addCrossHair(d3, focus, width, height);

    // draw initial curve
    focus
      .append('path')
      .datum(curvePoints)
      .attr('id', 'initial') // id is currently not used
      .attr('fill', 'none')
      .attr('stroke', 'lightgray')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1)
      .attr('d', line);

    // 1. create draggable points that need to be of type 'circle' so that the
    //    dragging events are correctly added
    // 2. add drag behaviour to all draggable points
    drawDraggablePoints(focus, x, y, drag, points);
    focus.selectAll('circle').call(drag);

    // draw curve points or lines
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(d3, focus, x, y, curvePoints);
    } else {
      drawCurveLines(d3, focus, line, curvePoints);
    }

    // most likely, this is not best practice
    // (these variables are needed for `handlePointCoordinateChange`)
    setDrawing({
      d3: d3,
      focus: focus,
      x: x,
      y: y,
      drag: drag,
      line: line,
    });

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

      const regression = polynomialRegression(points, order);
      setCoefficients(regression.equation);
      setEquation(regression.string);
      setR2(regression.r2);

      const newCurvePoints = calculateCurvePoints(points, order);
      setCurvePoints(newCurvePoints);

      // sort points to not have "invalid" functions
      sortPointsByX(points);
      setPoints(points);

      if (SHOW_DOTTED_CURVE) {
        drawCurvePoints(d3, focus, x, y, newCurvePoints);
      } else {
        drawCurveLines(d3, focus, line, newCurvePoints);
      }
    }

    function dragended(d) {
      d3.select(this).classed('active', false);
    }
  };

  const updateOrder = e => {
    const newOrder = parseInt(e.target.value);

    // add or remove points until there is one more point than the new order
    let cPoints = JSON.parse(JSON.stringify(points)); // deep copy
    while (cPoints.length - 1 != newOrder) {
      cPoints.length - 1 < newOrder && addPoint(cPoints);
      cPoints.length - 1 > newOrder && removePoint(cPoints);
    }

    clearSVG();

    sortPointsByX(cPoints);
    setPoints(cPoints);
    setOrder(newOrder);
  };

  const handlePointCoordinateChange = (event, pointIndex, coordinateIndex) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || parseFloat(value) === NaN) {
      value = 0;
    }

    // update changed coordinate in points list and re-draw draggable points
    const newPoints = [...points];
    newPoints[pointIndex][coordinateIndex] = parseFloat(value);
    setPoints(newPoints);
    drawDraggablePoints(drawing.focus, drawing.x, drawing.y, drawing.drag, points);

    // calculate new curve points and re-draw curve (dotted or lined)
    const newCurvePoints = calculateCurvePoints(points, order);
    setCurvePoints(newCurvePoints);
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(drawing.d3, drawing.focus, drawing.x, drawing.y, newCurvePoints);
    } else {
      drawCurveLines(drawing.d3, drawing.focus, drawing.line, newCurvePoints);
    }

    // re-compute regression
    const regression = polynomialRegression(points, order);
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
      point[1] = round(polynomialCallback(point[0], newCoefficients), PRECISION_POINTS);
      return point;
    });
    setPoints(newPoints);

    // re-draw draggable points
    drawDraggablePoints(drawing.focus, drawing.x, drawing.y, drawing.drag, newPoints);

    // calculate new curve points and re-draw curve (dotted or lined)
    const newCurvePoints = calculateCurvePoints(points, order);
    setCurvePoints(newCurvePoints);
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(drawing.d3, drawing.focus, drawing.x, drawing.y, newCurvePoints);
    } else {
      drawCurveLines(drawing.d3, drawing.focus, drawing.line, newCurvePoints);
    }

    // re-compute regression
    const regression = polynomialRegression(newPoints, order);
    setCoefficients(regression.equation);
    setEquation(regression.string);
    setR2(regression.r2);

    // TODO: be sure to not enter an endless loop :/
  };

  return (
    <div style={{ display: 'flex' }}>
      <svg ref={SVG_REF} width={SVG_SIZE.width} height={SVG_SIZE.height} style={{ float: 'left' }}>
        <defs>
          <style type="text/css">{`
            circle {
              fill: steelblue;
            }
            circle.active {
              fill: gray;
              stroke: black;
            }
          `}</style>
        </defs>
      </svg>
      <div>
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
            <div>Coeffs: {`  y = ${constructPolynomialEquation(coefficients)}`}</div>
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
                  max={X_MAX}
                  step={Math.pow(10, -(PRECISION_POINTS - 1))}
                  value={point[0]}
                  onChange={e => handlePointCoordinateChange(e, i, 0)}
                />{' '}
                y:{' '}
                <input
                  className="number"
                  type="number"
                  min="0"
                  max={Y_MAX}
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
