import * as React from 'react';
import * as d3 from 'd3';

import * as Drawing from './drawing';
import * as Utils from './utils';
import * as Regression from './regression';

const CurveGenerator = props => {
  const changeCurveName = value => props.changeCurveName(value);
  const changeCurveDescription = value => props.changeCurveDescription(value);
  const changePolynomialOrder = value => props.changePolynomialOrder(value);

  /***************************************************************************/
  /* Settings                                                                */
  /***************************************************************************/
  // Adjust the following parameters to your needs

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
  // TODO:
  // maybe this should be the same as the points of the regression have the
  // same precision as the polynomial's coefficients
  const PRECISION_COEFFICIENT = 4;
  const PRECISION_POINTS = 2;

  /***************************************************************************/
  /* Derived Settings                                                        */
  /***************************************************************************/
  // These parameters are derived from the previous settings and should not be
  // changed

  const GRAPH_SIZE = {
    width: SVG_SIZE.width - GRAPH_MARGIN.left - GRAPH_MARGIN.right,
    height: SVG_SIZE.height - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom,
  };

  const X_SCALE = d3.scaleLinear().rangeRound([0, GRAPH_SIZE.width]);
  const Y_SCALE = d3.scaleLinear().rangeRound([GRAPH_SIZE.height, 0]);

  const LINE = d3
    .line()
    .x(d => X_SCALE(d[0]))
    .y(d => Y_SCALE(d[1]));

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

  const drawCurvePoints = (graph, curvePoints) => {
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
      .attr('cx', d => X_SCALE(d[0]))
      .attr('cy', d => Y_SCALE(d[1]))
      .attr('rx', 2.0)
      .attr('ry', 2.0)
      .style('fill', CURVE_DOTS_COLOR);
  };

  const drawCurveLines = (graph, xScale, yScale, curvePoints) => {
    // remove old lines
    d3.select('svg')
      .select('g')
      .select('#curve')
      .remove();

    const curve = graph.append('g').attr('id', 'curve');

    const line = d3
      .line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

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

  const drawDraggablePoints = (graph, xScale, yScale, points, xAxis, yAxis) => {
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
      .attr('cx', d => xScale(d[0]))
      .attr('cy', d => yScale(d[1]))
      .style('cursor', 'pointer');

    // define drag events (methods are defined below)
    const drag = d3
      .drag()
      .on('start', (d, i, n) => dragStarted(d, i, n))
      .on('drag', (d, i, n) => dragged(d, i, n))
      .on('end', (d, i, n) => dragEnded(d, i, n));

    // add drag behaviour to all draggable points
    draggablePoints.selectAll('circle').call(drag);

    const dragStarted = (datum, index, nodes) => {
      // https://stackoverflow.com/questions/45262172/retrieve-dom-target-from-drag-callback-when-this-is-not-available/45262284#45262284
      const node = nodes[index]; // regular function: this = nodes[index]
      d3.select(node)
        .raise()
        .classed('active', true);
    };

    const dragged = (datum, index, nodes) => {
      const node = nodes[index];

      // change coordinate of points
      datum[0] = Utils.round(xScale.invert(d3.event.x), PRECISION_POINTS);
      datum[1] = Utils.round(yScale.invert(d3.event.y), PRECISION_POINTS);

      // update location of point
      d3.select(node)
        .attr('cx', xScale(datum[0]))
        .attr('cy', yScale(datum[1]));

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
        drawCurvePoints(graph, newCurvePoints);
      } else {
        drawCurveLines(graph, xScale, yScale, newCurvePoints);
      }
    };

    const dragEnded = (datum, index, nodes) => {
      const node = nodes[index];
      d3.select(node).classed('active', false);
      drawDraggablePoints(graph, xScale, yScale, points, xAxis, yAxis);
    };
  };

  const addZooming = graph => {
    // based on: https://stackoverflow.com/questions/39387727/d3v4-zooming-equivalent-to-d3-zoom-x
    const zoom = d3.zoom().on('zoom', () => zoomed());
    graph.call(zoom).on('mousedown.zoom', null);

    const zoomed = () => {
      const newXDomain = d3.event.transform.rescaleX(X_SCALE).domain();
      const newYDomain = d3.event.transform.rescaleY(Y_SCALE).domain();
      const newXAxis = { min: Utils.round(newXDomain[0], 0), max: Utils.round(newXDomain[1], 0) };
      const newYAxis = { min: Utils.round(newYDomain[0], 0), max: Utils.round(newYDomain[1], 0) };
      setXAxis(newXAxis);
      setYAxis(newYAxis);

      X_SCALE.domain([newXAxis.min, newXAxis.max]);
      Y_SCALE.domain([newYAxis.min, newYAxis.max]);

      const newDrawing = { ...drawing };
      newDrawing.x = X_SCALE;
      newDrawing.y = Y_SCALE;

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
      draw(newXAxis, newYAxis, newCurvePoints);
    };
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

  React.useEffect(() => draw(xAxis, yAxis, curvePoints), [order]);

  // needed for zooming and moving the coordinate system
  let dragged = false;
  let diffDragged = [0, 0];

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const draw = (xAxis, yAxis, curvePoints) => {
    // implementation based on:
    // https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

    // define svg and link it with the dom element
    const svg = d3.select(SVG_REF.current);

    // append graph as 'group' element to the svg and move it to the top left margin
    const graph = svg
      .append('g')
      .attr('id', 'graph')
      .attr('transform', 'translate(' + GRAPH_MARGIN.left + ',' + GRAPH_MARGIN.top + ')');

    // set domains of x and y axis
    X_SCALE.domain([xAxis.min, xAxis.max]);
    Y_SCALE.domain([yAxis.min, yAxis.max]);

    Drawing.drawGrid(graph, X_SCALE, Y_SCALE, GRAPH_SIZE);
    Drawing.drawAxesOnGraph(graph, X_SCALE, Y_SCALE, GRAPH_SIZE);
    Drawing.drawAxesAroundGraph(graph, X_SCALE, Y_SCALE, GRAPH_SIZE);
    Drawing.drawInitialCurve(graph, X_SCALE, Y_SCALE, curvePoints);

    Drawing.drawGraphTitle(svg, GRAPH_MARGIN, GRAPH_SIZE, curveName);
    Drawing.drawAxisLables(svg, GRAPH_MARGIN, GRAPH_SIZE, xAxisLabel, yAxisLabel);

    // draw curve points or lines
    if (SHOW_DOTTED_CURVE) {
      drawCurvePoints(graph, curvePoints);
    } else {
      drawCurveLines(graph, X_SCALE, Y_SCALE, curvePoints);
    }

    Drawing.addCrosshair(graph, X_SCALE, Y_SCALE, GRAPH_SIZE);
    drawDraggablePoints(graph, X_SCALE, Y_SCALE, points, xAxis, yAxis);

    // most likely, this is not best practice
    // (these variables are needed for methods like `handlePointCoordinateChange`)
    setDrawing({
      svg: svg,
      graph: graph,
      x: X_SCALE,
      y: Y_SCALE,
      line: LINE,
    });

    addZooming(graph);

    // let the graph be "movable" (aka panning) with the mouse
    graph
      .on('mousedown.drag', () => mouseDown())
      .on('mousemove.drag', () => mouseMove())
      .on('mouseup.drag', () => mouseUp())
      .on('mouseleave', () => mouseUp());

    const mouseDown = () => {
      d3.select('body').style('cursor', 'move');
      dragged = true;
    };

    const mouseMove = () => {
      if (dragged) {
        // get length of both axes
        const xAxisLength = xAxis.max - xAxis.min;
        const yAxisLength = yAxis.max - yAxis.min;

        // calculate differences of the coordinates during the mouse move
        const diffX = (d3.event.movementX / GRAPH_SIZE.width) * xAxisLength;
        const diffY = (d3.event.movementY / GRAPH_SIZE.height) * yAxisLength;

        // add these differences to the ones from the previous calls to this function
        diffDragged = [diffDragged[0] + diffX, diffDragged[1] + diffY];

        // redraw the whole graph if the drag difference of either the x or the y axis is above some threshold
        const threshold = 0.5; // min/max of the axis will be rounded with no decimal places
        const isDiffXAbove = Math.abs(diffDragged[0]) >= threshold;
        const isDiffYAbove = Math.abs(diffDragged[1]) >= threshold;
        if (isDiffXAbove || isDiffYAbove) {
          const newDrawing = { ...drawing };
          let newXAxis = xAxis;
          let newYAxis = yAxis;

          if (isDiffXAbove) {
            // shift x domain by drag difference
            const newXDomain = [xAxis.min - diffDragged[0], [xAxis.max - diffDragged[0]]];

            // set new min and max values of the x axis
            newXAxis = {
              min: Utils.round(newXDomain[0], 0),
              max: Utils.round(newXDomain[1], 0),
            };
            setXAxis(newXAxis);

            // reset the domain of the global x axis object used to draw with d3
            X_SCALE.domain([newXAxis.min, newXAxis.max]);
            newDrawing.x = X_SCALE;

            // reset drag difference of the x coordinate
            diffDragged[0] = 0;
          }

          if (isDiffYAbove) {
            // shift y domain by drag difference
            const newYDomain = [yAxis.min + diffDragged[1], [yAxis.max + diffDragged[1]]];

            // set new min and max values of the y axis
            newYAxis = {
              min: Utils.round(newYDomain[0], 0),
              max: Utils.round(newYDomain[1], 0),
            };
            setYAxis(newYAxis);

            // reset the domain of the global y axis object used to draw with d3
            Y_SCALE.domain([newYAxis.min, newYAxis.max]);
            newDrawing.y = Y_SCALE;

            // reset drag difference of the x coordinate
            diffDragged[1] = 0;
          }

          // remove all drawings from the svg and store the new global axes for d3
          clearSVG();
          setDrawing(newDrawing);

          // generate new curve points and redraw everything
          const newCurvePoints = Regression.generateCurvePoints(
            points,
            order,
            newXAxis.min,
            newXAxis.max,
            PRECISION_COEFFICIENT
          );
          setCurvePoints(newCurvePoints);
          draw(newXAxis, newYAxis, newCurvePoints);
        }
      }
    };

    const mouseUp = () => {
      d3.select('body').style('cursor', 'auto');
      diffDragged = [0, 0];
      dragged = false;
    };
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
      drawCurvePoints(drawing.graph, newCurvePoints);
    } else {
      drawCurveLines(drawing.graph, drawing.x, drawing.y, newCurvePoints);
    }

    drawDraggablePoints(drawing.graph, drawing.x, drawing.y, points, xAxis, yAxis);
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
