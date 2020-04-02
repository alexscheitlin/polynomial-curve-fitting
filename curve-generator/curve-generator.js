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
  const GRAPH_MARGIN = { top: 30, right: 20, bottom: 30, left: 50 };

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
  const initialXAxis = { min: -5, max: 10 };
  const initialYAxis = { min: -5, max: 10 };

  // create random points based on the initial order
  const initialPoints = Utils.generateRandomPoints(
    initialPolynomialOrder + 1,
    PRECISION_POINTS,
    initialXAxis.min,
    initialXAxis.max,
    initialYAxis.min,
    initialYAxis.max
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
    // remove graph
    d3.select('svg')
      .select('g')
      .remove();

    // remove title and axis labels
    d3.select('svg')
      .selectAll('text')
      .remove();

    //.selectAll('*') // remove everything withing the svg tag (including the styling)
  };

  // draw both the x and y axes through 0/0 spanning the whole graph
  const drawAxesOnGraph = (graph, x, y, graphWidth, graphHeight) => {
    // based on: http://bl.ocks.org/stepheneb/1182434
    const color = 'black';
    const lineWidth = 0.5;

    const axes = graph.append('g').attr('id', 'axes-in');

    // x axis
    axes
      .append('g')
      .attr('id', 'axis-in-x')
      .append('line')
      .attr('y1', 0)
      .attr('y2', graphHeight)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('transform', 'translate(' + x(0) + ' , 0)');

    // y axis
    axes
      .append('g')
      .attr('id', 'axis-in-y')
      .append('line')
      .attr('x1', 0)
      .attr('x2', graphWidth)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('transform', 'translate(0, ' + y(0) + ')');
  };

  // draw both the x and y axes around the graph (not necessarily through 0/0))
  const drawAxesAroundGraph = (d3, graph, x, y, graphWidth, graphHeight) => {
    // set position of the axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    const axes = graph.append('g').attr('id', 'axes-out');

    // draw x axis
    axes
      .append('g')
      .attr('id', 'axis-out-x')
      .attr('transform', 'translate(0,' + graphHeight + ')')
      .call(xAxis);

    // draw y axis
    axes
      .append('g')
      .attr('id', 'axis-out-y')
      .call(yAxis);
  };

  // draw the grid for both the x and y axes
  const drawGrid = (d3, graph, x, y, graphWidth, graphHeight) => {
    // based on: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218

    const color = 'lightgray';
    const numberOfLines = 10;

    const xGrid = d3.axisBottom(x).ticks(numberOfLines);
    const yGrid = d3.axisLeft(y).ticks(numberOfLines);

    const grid = graph.append('g').attr('id', 'grid');

    // draw x grid lines
    grid
      .append('g')
      .attr('id', 'grid-x')
      .attr('class', 'grid')
      .attr('transform', 'translate(0,' + graphHeight + ')')
      .call(xGrid.tickSize(-graphHeight).tickFormat(''));

    // draw y grid lines
    grid
      .append('g')
      .attr('id', 'grid-y')
      .attr('class', 'grid')
      .call(yGrid.tickSize(-graphWidth).tickFormat(''));

    // style grid
    d3.selectAll('g.grid g.tick')
      .select('line')
      .attr('stroke', color);
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
      .select('#curve')
      .remove();

    const curve = graph.append('g').attr('id', 'curve');

    // draw new lines
    curve
      .append('path')
      .datum(curvePoints)
      .attr('id', 'curve-path')
      .attr('fill', 'none')
      .attr('stroke', CURVE_LINE_COLOR)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('d', line);
  };

  const drawDraggablePoints = (graph, x, y, line, points) => {
    // remove old points
    d3.select('svg')
      .select('g')
      .select('g#draggable-points')
      .remove();

    const draggablePoints = graph.append('g').attr('id', 'draggable-points');

    draggablePoints
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('r', 8.0)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .style('cursor', 'pointer');

    // define drag events (methods are defined below)
    const drag = d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    // add drag behaviour to all draggable points
    draggablePoints.selectAll('circle').call(drag);

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
        xAxis.min,
        xAxis.max,
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
      drawDraggablePoints(graph, x, y, line, points);
    }
  };

  const addCrosshair = (d3, graph, x, y, width, height) => {
    // based on
    // https://stackoverflow.com/questions/38687588/add-horizontal-crosshair-to-d3-js-chart
    const color = 'lightgray';
    const lineWidth = 1.0;
    const dashes = '3 3'; // width of one dash and space between two dashes

    const crosshair = graph.append('g').attr('id', 'crosshair');

    const transpRect = crosshair
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0);

    const verticalLine = crosshair
      .append('line')
      .attr('id', 'crosshair-vertcal')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('opacity', 0)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    const horizontalLine = crosshair
      .append('line')
      .attr('id', 'crosshair-horizontal')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('opacity', 0)
      .attr('stroke', color)
      .attr('stroke-width', lineWidth)
      .attr('pointer-events', 'none')
      .style('stroke-dasharray', dashes);

    const text = crosshair
      .append('text')
      .attr('id', 'crosshair-coordinates')
      .attr('x', 0)
      .attr('y', 0)
      .attr('opacity', 0)
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

  const drawCurveName = (svg, value) => svg.select('text#curve-name').text(value);

  const drawXAxisLabel = (svg, value) => svg.select('text#x-axis-label').text(value);

  const drawYAxisLabel = (svg, value) => svg.select('text#y-axis-label').text(value);

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  const SVG_REF = React.useRef();
  const [order, setOrder] = React.useState(initialPolynomialOrder);
  const [points, setPoints] = React.useState(initialPoints);
  const [curvePoints, setCurvePoints] = React.useState(
    Regression.generateCurvePoints(
      points,
      order,
      initialXAxis.min,
      initialXAxis.max,
      PRECISION_COEFFICIENT
    )
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
  const [xAxis, setXAxis] = React.useState(initialXAxis);
  const [yAxis, setYAxis] = React.useState(initialYAxis);

  const [curveName, setCurveName] = React.useState(initialCurveName);
  const [curveDescription, setCurveDescription] = React.useState(initialCurveDescription);
  const [xAxisLabel, setXAxisLabel] = React.useState(initialXAxisLabel);
  const [yAxisLabel, setYAxisLabel] = React.useState(initialYAxisLabel);

  React.useEffect(() => init(xAxis, yAxis, curvePoints), [order]);

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const init = (xAxis, yAxis, curvePoints) => {
    //console.log(curvePoints);
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

    // define how lines should be drawn
    const line = d3
      .line()
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    // append graph as 'group' element to the svg and move it to the top left margin
    const graph = svg
      .append('g')
      .attr('id', 'graph')
      .attr('transform', 'translate(' + GRAPH_MARGIN.left + ',' + GRAPH_MARGIN.top + ')');

    // set domains of x and y axis
    x.domain([xAxis.min, xAxis.max]);
    y.domain([yAxis.min, yAxis.max]);

    drawGrid(d3, graph, x, y, graphWidth, graphHeight);
    drawAxesOnGraph(graph, x, y, graphWidth, graphHeight);
    drawAxesAroundGraph(d3, graph, x, y, graphWidth, graphHeight);

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

    addCrosshair(d3, graph, x, y, graphWidth, graphHeight);
    drawDraggablePoints(graph, x, y, line, points);

    // most likely, this is not best practice
    // (these variables are needed for methods like `handlePointCoordinateChange`)
    setDrawing({
      d3: d3,
      svg: svg,
      graph: graph,
      x: x,
      y: y,
      line: line,
    });

    // draw curve name
    svg
      .append('text')
      .attr('id', 'curve-name')
      .attr(
        'transform',
        'translate(' + (graphWidth / 2 + GRAPH_MARGIN.left) + ', ' + GRAPH_MARGIN.top / 2 + ')'
      )
      .attr('font-size', '1rem')
      .attr('font-weight', 'bold')
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text(curveName);

    // text label for the x axis
    // https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
    svg
      .append('text')
      .attr('id', 'x-axis-label')
      .attr(
        'transform',
        'translate(' +
          (graphWidth / 2 + GRAPH_MARGIN.left) +
          ', ' +
          (graphHeight + GRAPH_MARGIN.top + GRAPH_MARGIN.bottom) +
          ')'
      )
      .style('text-anchor', 'middle')
      .text(xAxisLabel);

    // text label for the y axis
    svg
      .append('text')
      .attr('id', 'y-axis-label')
      .attr(
        'transform',
        'rotate(-90), translate(' +
          (-graphHeight / 2 - GRAPH_MARGIN.top) +
          ', ' +
          GRAPH_MARGIN.left / 2 +
          ')'
      )
      .style('text-anchor', 'middle')
      .text(yAxisLabel);

    // base on: https://stackoverflow.com/questions/39387727/d3v4-zooming-equivalent-to-d3-zoom-x
    const zoom = d3.zoom().on('zoom', zoomed);
    graph.call(zoom).on('mousedown.zoom', null);

    function zoomed() {
      const newXDomain = d3.event.transform.rescaleX(x).domain();
      const newYDoamin = d3.event.transform.rescaleY(y).domain();
      const newXAxis = { min: Utils.round(newXDomain[0], 0), max: Utils.round(newXDomain[1], 0) };
      const newYAxis = { min: Utils.round(newXDomain[0], 0), max: Utils.round(newXDomain[1], 0) };
      setXAxis(newXAxis);
      setYAxis(newYAxis);

      x.domain([newXAxis.min, newXAxis.max]);
      y.domain([newYAxis.min, newYAxis.max]);

      const newDrawing = { ...drawing };
      newDrawing.x = x;
      newDrawing.x = y;

      clearSVG();
      setDrawing(newDrawing);

      const newCurvePoints = Regression.generateCurvePoints(
        points,
        order,
        newXAxis.min,
        newXAxis.max,
        PRECISION_COEFFICIENT
      );

      setCurvePoints(newCurvePoints);
      init(newXAxis, newYAxis, newCurvePoints);
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
    drawCurveName(drawing.svg, newValue);
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
      xAxis.min,
      xAxis.max,
      PRECISION_COEFFICIENT
    );
    setCurvePoints(newCurvePoints);

    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(drawing.d3, drawing.graph, drawing.x, drawing.y, newCurvePoints);
    } else {
      drawCurveLines(drawing.d3, drawing.graph, drawing.line, newCurvePoints);
    }

    drawDraggablePoints(drawing.graph, drawing.x, drawing.y, drawing.line, points);
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
                  min={xAxis.min}
                  max={xAxis.max}
                  step={Math.pow(10, -(PRECISION_POINTS - 1))}
                  value={point[0]}
                  onChange={e => handlePointCoordinateChange(e, i, 0)}
                />{' '}
                y:{' '}
                <input
                  className="number"
                  type="number"
                  min={yAxis.min}
                  max={yAxis.max}
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
