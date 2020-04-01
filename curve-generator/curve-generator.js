import * as React from 'react';
import * as d3 from 'd3';

import * as Utils from './utils';
import * as Regression from './regression';

const CurveGenerator = props => {
  const changeCurveName = value => props.changeCurveName(value);
  const changeCurveDescription = value => props.changeCurveDescription(value);
  const changePolynomialOrder = value => props.changePolynomialOrder(value);

  /***************************************************************************/
  /* Settings                                                                */
  /***************************************************************************/
  // size of final SVG in pixel
  const SVG_SIZE = { width: 750, height: 450 };

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

  /***************************************************************************/
  /* Default Values                                                          */
  /***************************************************************************/
  // The default values are used if no prop values are specified.

  const DEFAULT_CURVE_NAME = `Random Polynomial`;
  const DEFAULT_CURVE_DESCRIPTION = 'This is some random polynomial.';
  const DEFAULT_POLYNOMIAL_ORDER = 3;

  /***************************************************************************/
  /* Initial Values                                                          */
  /***************************************************************************/

  const initialCurveName = props.curveName || DEFAULT_CURVE_NAME;
  const initialCurveDescription = props.curveDescription || DEFAULT_CURVE_DESCRIPTION;
  const initialPolynomialOrder = props.polynomialOrder || DEFAULT_POLYNOMIAL_ORDER;
  const initialXAxisLabel = 'x Values';
  const initialYAxisLabel = 'y Values';

  // create random points based on the initial order
  const initialPoints = Utils.generateRandomPoints(
    initialPolynomialOrder + 1,
    PRECISION_POINTS,
    X_AXIS.min,
    X_AXIS.max,
    Y_AXIS.min,
    Y_AXIS.max
  );

  // use predefined points (needs to be one more than the specified order of the polynomial)
  // const initialPoints = [
  //   [0, 0],
  //   [5, 8],
  //   [10, 2],
  // ];

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
      .attr('dx', '1em')
      .attr('dy', '-1em')
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
          .text(
            () => `x: ${Utils.round(x.invert(mouseX), 2)}, y: ${Utils.round(y.invert(mouseY), 2)}`
          )
          .attr('opacity', 1);
      })
      .on('mouseout', function() {
        verticalLine.attr('opacity', 0);
        horizontalLine.attr('opacity', 0);
        text.attr('opacity', 0);
      });
  };

  const drawCurveName = (graph, value) => graph.select('text#curve-name').text(value);

  const drawXAxisLabel = (svg, value) => svg.select('text#x-axis-label').text(value);

  const drawYAxisLabel = (svg, value) => svg.select('text#y-axis-label').text(value);

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  const SVG_REF = React.useRef();
  const [order, setOrder] = React.useState(initialPolynomialOrder);
  const [points, setPoints] = React.useState(initialPoints);
  const [curvePoints, setCurvePoints] = React.useState(
    Regression.generateCurvePoints(points, order, X_AXIS.min, X_AXIS.max, PRECISION_COEFFICIENT)
  );
  const [coefficients, setCoefficients] = React.useState(
    Regression.polynomialRegression(points, order, PRECISION_COEFFICIENT).equation
  );
  const [equation, setEquation] = React.useState(
    Regression.polynomialRegression(points, order, PRECISION_COEFFICIENT).string
  );
  const [r2, setR2] = React.useState(
    Regression.polynomialRegression(points, order, PRECISION_COEFFICIENT).r2
  );
  const [drawing, setDrawing] = React.useState({}); // most likely, this is not best practice

  const [curveName, setCurveName] = React.useState(initialCurveName);
  const [curveDescription, setCurveDescription] = React.useState(initialCurveDescription);
  const [xAxisLabel, setXAxisLabel] = React.useState(initialXAxisLabel);
  const [yAxisLabel, setYAxisLabel] = React.useState(initialYAxisLabel);

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
    // (these variables are needed for methods like `handlePointCoordinateChange`)
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
      .attr('transform', 'translate(' + (SVG_SIZE.width / 2 - GRAPH_MARGIN.left) + ' ,' + 0 + ')')
      .attr('font-size', '1rem')
      .attr('font-weight', 'bold')
      .attr('fill', 'black')
      .style('text-anchor', 'middle');
    drawCurveName(graph, curveName);

    // text label for the x axis
    // https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
    svg
      .append('text')
      .attr('id', 'x-axis-label')
      .attr(
        'transform',
        'translate(' +
          (graphWidth / 2 + GRAPH_MARGIN.left) +
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
      .attr('x', 0 - graphHeight / 2 - GRAPH_MARGIN.top)
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
      d[0] = Utils.round(x.invert(d3.event.x), PRECISION_POINTS);
      d[1] = Utils.round(y.invert(d3.event.y), PRECISION_POINTS);

      // update location of point
      d3.select(this)
        .attr('cx', x(d[0]))
        .attr('cy', y(d[1]));

      updateRegressionState(points, order);

      const newCurvePoints = Regression.generateCurvePoints(
        points,
        order,
        X_AXIS.min,
        X_AXIS.max,
        PRECISION_COEFFICIENT
      );
      setCurvePoints(newCurvePoints);

      // sort points to not have "invalid" functions
      setPoints(Utils.sortPointsByX(points));

      if (SHOW_DOTTED_CURVE) {
        drawCurvePoints(d3, graph, x, y, newCurvePoints);
      } else {
        drawCurveLines(d3, graph, line, newCurvePoints);
      }
    }

    function dragended(d) {
      d3.select(this).classed('active', false);
      drawDraggablePoints(graph, x, y, drag, points);
    }
  };

  /***************************************************************************/
  /* State Updates                                                           */
  /***************************************************************************/
  // update the state and possibly other states if needed
  // re-draw some graphics if needed

  const updateCurveNameState = newValue => {
    setCurveName(newValue);
    changeCurveName(newValue);
    drawCurveName(drawing.graph, newValue);
  };

  const updateCurveDescriptionState = newValue => {
    setCurveDescription(newValue);
  };

  const updateXAxisLabelState = newValue => {
    setXAxisLabel(newValue);
    drawXAxisLabel(drawing.svg, newValue);
  };

  const updateYAxisLabelState = newValue => {
    setYAxisLabel(newValue);
    drawYAxisLabel(drawing.svg, newValue);
  };

  const updateOrderState = newValue => {
    // add or remove points until there is one more point than the new order
    let cPoints = Utils.deepCopy(points);
    while (cPoints.length - 1 != newValue) {
      cPoints.length - 1 < newValue &&
        Utils.addPoint(cPoints, PRECISION_COEFFICIENT, PRECISION_POINTS);
      cPoints.length - 1 > newValue && Utils.removePoint(cPoints);
    }

    clearSVG();

    setPoints(Utils.sortPointsByX(cPoints));
    setOrder(newValue);
  };

  const updateCoefficientState = (newValue, coefficientIndex) => {
    // update coefficient list (don't update state yet -> is done in updatePointsState)
    const newCoefficients = [...coefficients];
    newCoefficients[coefficientIndex] = parseFloat(newValue);

    // calculate new y values for the x values
    const newPoints = [...points].map(point => {
      point[1] = Utils.round(Utils.polynomialValue(point[0], newCoefficients), PRECISION_POINTS);
      return point;
    });

    updatePointsState(newPoints, order);
  };

  const updatePointCoordinateState = (newValue, pointIndex, coordinateIndex) => {
    // update changed coordinate in points list
    const newPoints = [...points];
    newPoints[pointIndex][coordinateIndex] = parseFloat(newValue);

    updatePointsState(newPoints, order);
  };

  const updatePointsState = (points, order) => {
    setPoints(points);

    // generate new points on the curve and redraw the curve
    const newCurvePoints = Regression.generateCurvePoints(
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

    drawDraggablePoints(drawing.graph, drawing.x, drawing.y, drawing.drag, points);
    updateRegressionState(points, order);
  };

  const updateRegressionState = (points, order) => {
    const regression = Regression.polynomialRegression(points, order, PRECISION_COEFFICIENT);
    setCoefficients(regression.equation);
    setEquation(regression.string);
    setR2(regression.r2);
  };

  /***************************************************************************/
  /* Input Handling                                                          */
  /***************************************************************************/
  // extract and validate input and then update the state

  const handleCurveNameChange = event => updateCurveNameState(event.target.value);
  const handleCurveDescriptionChange = event => updateCurveDescriptionState(event.target.value);
  const handleXAxisLabelChange = event => updateXAxisLabelState(event.target.value);
  const handleYAxisLabelChange = event => updateYAxisLabelState(event.target.value);
  const handleOrderChange = event => updateOrderState(parseInt(event.target.value));

  const handleCurveCoefficientsChange = (event, coefficientIndex) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || parseFloat(value) === NaN) {
      value = 0;
    }

    updateCoefficientState(value, coefficientIndex);
  };

  const handlePointCoordinateChange = (event, pointIndex, coordinateIndex) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || parseFloat(value) === NaN) {
      value = 0;
    }

    updatePointCoordinateState(value, pointIndex, coordinateIndex);
  };

  /***************************************************************************/
  /* Render                                                                  */
  /***************************************************************************/

  return (
    <div style={{ display: 'flex' }}>
      <div>
        <div style={{ width: `${SVG_SIZE.width}px`, height: `${SVG_SIZE.height}px` }}>
          <svg
            ref={SVG_REF}
            width={SVG_SIZE.width}
            height={SVG_SIZE.height}
            style={{ float: 'left' }}
          >
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
        </div>
        <p style={{ width: `${SVG_SIZE.width}px`, padding: '5px', textAlign: 'center' }}>
          {curveDescription}
        </p>
      </div>

      <div style={{ marginLeft: '1rem' }}>
        <div>
          <select onChange={e => handleOrderChange(e)} value={order}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>

        <hr></hr>

        <pre style={{ color: r2 === 1 ? 'green' : 'red' }}>
          Coefficient of Determination (R^2): {JSON.stringify(r2)}
        </pre>

        <hr></hr>

        <div>
          <pre>
            <div>Polynomial: {`  y = ${Utils.generatePolynomialEquation(coefficients)}`}</div>
            {/*<div>Equation: {equation}</div>*/}
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
                    onChange={e => handleCurveCoefficientsChange(e, i)}
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
                  min={X_AXIS.min}
                  max={X_AXIS.max}
                  step={Math.pow(10, -(PRECISION_POINTS - 1))}
                  value={point[0]}
                  onChange={e => handlePointCoordinateChange(e, i, 0)}
                />{' '}
                y:{' '}
                <input
                  className="number"
                  type="number"
                  min={Y_AXIS.min}
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
      </div>

      <div style={{ marginLeft: '2rem' }}>
        <table>
          <tbody>
            <tr>
              <td>
                <label>Name:</label>
              </td>
              <td>
                <input
                  type="text"
                  value={curveName}
                  onChange={e => handleCurveNameChange(e)}
                  placeholder="Curve Name"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>X-Axis:</label>
              </td>
              <td>
                <input
                  type="text"
                  value={xAxisLabel}
                  onChange={e => handleXAxisLabelChange(e)}
                  placeholder="X-Axis Label"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Y-Axis:</label>
              </td>
              <td>
                <input
                  type="text"
                  value={yAxisLabel}
                  onChange={e => handleYAxisLabelChange(e)}
                  placeholder="Y-Axis Label"
                />
              </td>
            </tr>
          </tbody>
          <style>{`
              table input {
                width: 300px;
              }
            `}</style>
        </table>

        <br></br>

        <div>
          <label>Description:</label>
          <br></br>

          <textarea
            rows="20"
            cols="43"
            onChange={e => handleCurveDescriptionChange(e)}
            value={curveDescription}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default CurveGenerator;
