import * as React from 'react';
import * as d3 from 'd3';

import * as Drawing from './drawing';
import * as Regression from './regression';
import * as Utils from './utils';
import { Axis, Curve, Props, Settings } from './types';
import { defaultProps } from './default-props';
import { initValues } from './init';

const CurveGenerator: React.FC<Props> = (props: Props) => {
  // const changeCurveName = (value: string) => props.changeCurveName(value);

  const [SETTINGS, INITIAL_CURVE]: [Settings, Curve] = initValues(props, defaultProps);

  /***************************************************************************/
  /* Drawing Methods                                                         */
  /***************************************************************************/

  // remove all drawings from svg
  const clearSVG = () => {
    // remove graph
    d3.select('svg').select('g').remove();

    // remove title and axis labels
    d3.select('svg').selectAll('text').remove();

    //.selectAll('*') // remove everything withing the svg tag (including the styling)
  };

  const drawDraggablePoints = (
    graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    points: number[][],
    xAxis: Axis,
    yAxis: Axis,
    radius: number
  ) => {
    // remove old points
    d3.select('svg').select('g').select('g#draggable-points').remove();

    const draggablePoints = graph.append('g').attr('id', 'draggable-points');

    const width = xScale(xScale.domain()[1]);
    const height = yScale(yScale.domain()[0]);

    const isPointOnGraph = (point: number[]) =>
      xScale(point[0]) >= 0 &&
      xScale(point[0]) <= width &&
      yScale(point[1]) >= 0 &&
      yScale(point[1]) <= height;

    draggablePoints
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('r', radius)
      .attr('cx', (d: number[]) => xScale(d[0]))
      .attr('cy', (d: number[]) => yScale(d[1]))
      .style('cursor', 'pointer')
      .attr('opacity', (d: number[]) => (isPointOnGraph(d) ? 1 : 0));

    const dragStarted = (_datum: any, index: number, nodes: Element[] | d3.ArrayLike<Element>) => {
      // https://stackoverflow.com/questions/45262172/retrieve-dom-target-from-drag-callback-when-this-is-not-available/45262284#45262284
      const node = nodes[index]; // regular function: this = nodes[index]
      d3.select(node).raise().classed('active', true);
    };

    const dragged = (datum: any, index: number, nodes: Element[] | d3.ArrayLike<Element>) => {
      const node = nodes[index];

      // change coordinate of points
      datum[0] = Utils.round(xScale.invert(d3.event.x), SETTINGS.precisionPoints);
      datum[1] = Utils.round(yScale.invert(d3.event.y), SETTINGS.precisionPoints);

      // update location of point
      d3.select(node)
        .attr('cx', xScale(datum[0]))
        .attr('cy', yScale(datum[1]))
        .attr('opacity', () => (isPointOnGraph(datum) ? 1 : 0));

      updateRegressionState(points, order);

      const newCurvePoints = Regression.generateCurvePoints(
        points,
        order,
        xAxis.min,
        xAxis.max,
        SETTINGS.precisionCoefficient
      );
      setCurvePoints(newCurvePoints);

      // sort points to not have "invalid" functions
      setPoints(Utils.sortPointsByX(points));

      if (SETTINGS.showDottedCurve) {
        Drawing.drawCurvePoints(graph, xScale, yScale, newCurvePoints, SETTINGS.curve.color);
      } else {
        Drawing.drawCurveLines(
          graph,
          xScale,
          yScale,
          newCurvePoints,
          SETTINGS.curve.color,
          SETTINGS.curve.strokeWidth
        );
      }
    };

    const dragEnded = (_datum: any, index: number, nodes: Element[] | d3.ArrayLike<Element>) => {
      const node = nodes[index];
      d3.select(node).classed('active', false);
      drawDraggablePoints(
        graph,
        xScale,
        yScale,
        points,
        xAxis,
        yAxis,
        SETTINGS.draggablePoint.radius
      );
    };

    // define drag events (methods are defined below)
    const drag = d3
      .drag()
      .on('start', (d, i, n) => dragStarted(d, i, n))
      .on('drag', (d, i, n) => dragged(d, i, n))
      .on('end', (d, i, n) => dragEnded(d, i, n));

    // add drag behaviour to all draggable points
    draggablePoints.selectAll('circle').call(drag as any);
  };

  const addZooming = (graph: d3.Selection<SVGGElement, any, HTMLElement, any>) => {
    // based on: https://stackoverflow.com/questions/39387727/d3v4-zooming-equivalent-to-d3-zoom-x

    const zoomed = () => {
      const newXDomain = d3.event.transform.rescaleX(SETTINGS.xScale).domain();
      const newYDomain = d3.event.transform.rescaleY(SETTINGS.yScale).domain();
      const newXAxis = {
        ...xAxis,
        min: Utils.round(newXDomain[0], 0),
        max: Utils.round(newXDomain[1], 0),
      };
      const newYAxis = {
        ...yAxis,
        min: Utils.round(newYDomain[0], 0),
        max: Utils.round(newYDomain[1], 0),
      };
      setXAxis(newXAxis);
      setYAxis(newYAxis);

      SETTINGS.xScale.domain([newXAxis.min, newXAxis.max]);
      SETTINGS.yScale.domain([newYAxis.min, newYAxis.max]);

      const newDrawing = Object.assign({}, drawing);
      newDrawing.x = SETTINGS.xScale;
      newDrawing.y = SETTINGS.yScale;

      clearSVG();
      setDrawing(newDrawing);

      const newCurvePoints = Regression.generateCurvePoints(
        points,
        order,
        newXAxis.min,
        newXAxis.max,
        SETTINGS.precisionCoefficient
      );

      setCurvePoints(newCurvePoints);
      draw(newXAxis, newYAxis, newCurvePoints);
    };

    const zoom = d3.zoom().on('zoom', () => zoomed());
    graph.call(zoom as any).on('mousedown.zoom', null);
  };

  const drawCurveName = (svg: d3.Selection<d3.BaseType, any, HTMLElement, any>, value: string) =>
    svg.select('text#curve-name').text(value);

  const drawXAxisLabel = (svg: d3.Selection<d3.BaseType, any, HTMLElement, any>, value: string) =>
    svg.select('text#x-axis-label').text(value);

  const drawYAxisLabel = (svg: d3.Selection<d3.BaseType, any, HTMLElement, any>, value: string) =>
    svg.select('text#y-axis-label').text(value);

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  interface Drawing {
    svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    graph: d3.Selection<SVGGElement, any, HTMLElement, any>;
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
  }

  const SVG_REF = React.useRef(null);
  const [order, setOrder] = React.useState(INITIAL_CURVE.polynomialOrder);
  const [points, setPoints] = React.useState(INITIAL_CURVE.points);
  const [curvePoints, setCurvePoints] = React.useState(INITIAL_CURVE.curvePoints);
  const [coefficients, setCoefficients] = React.useState(INITIAL_CURVE.coefficients);
  const [equation, setEquation] = React.useState(INITIAL_CURVE.equation);
  const [r2, setR2] = React.useState(INITIAL_CURVE.r2);
  const [drawing, setDrawing] = React.useState<Drawing>(); // most likely, this is not best practice

  const [curveName, setCurveName] = React.useState(INITIAL_CURVE.name);
  const [curveDescription, setCurveDescription] = React.useState(INITIAL_CURVE.description);
  const [xAxis, setXAxis] = React.useState<Axis>(INITIAL_CURVE.xAxis);
  const [yAxis, setYAxis] = React.useState<Axis>(INITIAL_CURVE.yAxis);

  React.useEffect(() => draw(xAxis, yAxis, curvePoints), [order]);

  // needed for zooming and moving the coordinate system
  let dragged = false;
  let diffDragged = [0, 0];

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const draw = (xAxis: Axis, yAxis: Axis, curvePoints: number[][]) => {
    // implementation based on:
    // https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

    // define svg and link it with the dom element
    const svg: d3.Selection<d3.BaseType, any, HTMLElement, any> = d3.select(SVG_REF.current);

    // append graph as 'group' element to the svg and move it to the top left margin
    const graph: d3.Selection<SVGGElement, any, HTMLElement, any> = svg
      .append('g')
      .attr('id', 'graph')
      .attr(
        'transform',
        'translate(' + SETTINGS.graph.margin.left + ',' + SETTINGS.graph.margin.top + ')'
      );

    // set domains of x and y axis
    SETTINGS.xScale.domain([xAxis.min, xAxis.max]);
    SETTINGS.yScale.domain([yAxis.min, yAxis.max]);

    Drawing.drawGrid(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      SETTINGS.graphSize,
      SETTINGS.graph.grid.color
    );
    Drawing.drawAxesOnGraph(graph, SETTINGS.xScale, SETTINGS.yScale, SETTINGS.graphSize);
    //Drawing.drawAxesAroundGraph(graph, SETTINGS.xScale, SETTINGS.yScale, SETTINGS.graphSize);
    Drawing.drawInitialCurve(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      curvePoints,
      SETTINGS.initialCurve.color,
      SETTINGS.initialCurve.strokeWidth
    );

    Drawing.drawGraphTitle(
      svg,
      SETTINGS.graph.margin,
      SETTINGS.graphSize,
      curveName,
      SETTINGS.graph.title.color,
      SETTINGS.graph.title.fontFamily,
      SETTINGS.graph.title.fontSize
    );
    Drawing.drawAxisLables(
      svg,
      SETTINGS.graph.margin,
      SETTINGS.graphSize,
      xAxis.label,
      yAxis.label,
      SETTINGS.graph.axisLabels.color,
      SETTINGS.graph.axisLabels.fontFamily,
      SETTINGS.graph.axisLabels.fontSize
    );

    // draw curve points or lines
    if (SETTINGS.showDottedCurve) {
      Drawing.drawCurvePoints(
        graph,
        SETTINGS.xScale,
        SETTINGS.yScale,
        curvePoints,
        SETTINGS.curve.color
      );
    } else {
      Drawing.drawCurveLines(
        graph,
        SETTINGS.xScale,
        SETTINGS.yScale,
        curvePoints,
        SETTINGS.curve.color,
        SETTINGS.curve.strokeWidth
      );
    }

    Drawing.addCrosshair(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      SETTINGS.graphSize,
      SETTINGS.crosshairColor
    );
    drawDraggablePoints(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      points,
      xAxis,
      yAxis,
      SETTINGS.draggablePoint.radius
    );

    // most likely, this is not best practice
    // (these variables are needed for methods like `handlePointCoordinateChange`)
    setDrawing({
      svg: svg,
      graph: graph,
      x: SETTINGS.xScale,
      y: SETTINGS.yScale,
    });

    addZooming(graph);

    // let the graph be "movable" (aka panning) with the mouse
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
        const diffX = (d3.event.movementX / SETTINGS.graphSize.width) * xAxisLength;
        const diffY = (d3.event.movementY / SETTINGS.graphSize.height) * yAxisLength;

        // add these differences to the ones from the previous calls to this function
        diffDragged = [diffDragged[0] + diffX, diffDragged[1] + diffY];

        // redraw the whole graph if the drag difference of either the x or the y axis is above some threshold
        const threshold = 0.5; // min/max of the axis will be rounded with no decimal places
        const isDiffXAbove = Math.abs(diffDragged[0]) >= threshold;
        const isDiffYAbove = Math.abs(diffDragged[1]) >= threshold;
        if (isDiffXAbove || isDiffYAbove) {
          const newDrawing = Object.assign({}, drawing);
          let newXAxis = xAxis;
          let newYAxis = yAxis;

          if (isDiffXAbove) {
            // shift x domain by drag difference
            const newXDomain = [xAxis.min - diffDragged[0], xAxis.max - diffDragged[0]];

            // set new min and max values of the x axis
            newXAxis = {
              ...xAxis,
              min: Utils.round(newXDomain[0], 0),
              max: Utils.round(newXDomain[1], 0),
            };
            setXAxis(newXAxis);

            // reset the domain of the global x axis object used to draw with d3
            SETTINGS.xScale.domain([newXAxis.min, newXAxis.max]);
            newDrawing.x = SETTINGS.xScale;

            // reset drag difference of the x coordinate
            diffDragged[0] = 0;
          }

          if (isDiffYAbove) {
            // shift y domain by drag difference
            const newYDomain = [yAxis.min + diffDragged[1], yAxis.max + diffDragged[1]];

            // set new min and max values of the y axis
            newYAxis = {
              ...yAxis,
              min: Utils.round(newYDomain[0], 0),
              max: Utils.round(newYDomain[1], 0),
            };
            setYAxis(newYAxis);

            // reset the domain of the global y axis object used to draw with d3
            SETTINGS.yScale.domain([newYAxis.min, newYAxis.max]);
            newDrawing.y = SETTINGS.yScale;

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
            SETTINGS.precisionCoefficient
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

    graph
      .on('mousedown.drag', () => mouseDown())
      .on('mousemove.drag', () => mouseMove())
      .on('mouseup.drag', () => mouseUp())
      .on('mouseleave', () => mouseUp());
  };

  /***************************************************************************/
  /* State Updates                                                           */
  /***************************************************************************/
  // update the state and possibly other states if needed
  // re-draw some graphics if needed

  const updateCurveNameState = (newValue: string) => {
    setCurveName(newValue);
    // changeCurveName(newValue);
    drawCurveName(drawing.svg, newValue);
  };

  const updateCurveDescriptionState = (newValue: string) => {
    setCurveDescription(newValue);
  };

  const updateXAxisLabelState = (newValue: string) => {
    setXAxis({ ...xAxis, label: newValue });
    drawXAxisLabel(drawing.svg, newValue);
  };

  const updateYAxisLabelState = (newValue: string) => {
    setYAxis({ ...yAxis, label: newValue });
    drawYAxisLabel(drawing.svg, newValue);
  };

  const updateOrderState = (newValue: number) => {
    // add or remove points until there is one more point than the new order
    const cPoints = Utils.deepCopy(points);
    while (cPoints.length - 1 != newValue) {
      cPoints.length - 1 < newValue &&
        Utils.addPoint(cPoints, SETTINGS.precisionCoefficient, SETTINGS.precisionPoints);
      cPoints.length - 1 > newValue && Utils.removePoint(cPoints);
    }

    clearSVG();

    setPoints(Utils.sortPointsByX(cPoints));
    setOrder(newValue);
  };

  const updateCoefficientState = (newValue: number, coefficientIndex: number) => {
    // update coefficient list (don't update state yet -> is done in updatePointsState)
    const newCoefficients = [...coefficients];
    newCoefficients[coefficientIndex] = newValue;

    // calculate new y values for the x values
    const newPoints = [...points].map(point => {
      point[1] = Utils.round(
        Utils.polynomialValue(point[0], newCoefficients),
        SETTINGS.precisionPoints
      );
      return point;
    });

    updatePointsState(newPoints, order);
  };

  const updatePointCoordinateState = (
    newValue: number,
    pointIndex: number,
    coordinateIndex: number
  ) => {
    // update changed coordinate in points list
    const newPoints = [...points];
    newPoints[pointIndex][coordinateIndex] = newValue;

    updatePointsState(newPoints, order);
  };

  const updatePointsState = (points: number[][], order: number) => {
    setPoints(points);

    // generate new points on the curve and redraw the curve
    const newCurvePoints = Regression.generateCurvePoints(
      points,
      order,
      xAxis.min,
      xAxis.max,
      SETTINGS.precisionCoefficient
    );
    setCurvePoints(newCurvePoints);

    if (SETTINGS.showDottedCurve) {
      Drawing.drawCurvePoints(
        drawing.graph,
        drawing.x,
        drawing.y,
        newCurvePoints,
        SETTINGS.curve.color
      );
    } else {
      Drawing.drawCurveLines(
        drawing.graph,
        drawing.x,
        drawing.y,
        newCurvePoints,
        SETTINGS.curve.color,
        SETTINGS.curve.strokeWidth
      );
    }

    drawDraggablePoints(
      drawing.graph,
      drawing.x,
      drawing.y,
      points,
      xAxis,
      yAxis,
      SETTINGS.draggablePoint.radius
    );
    updateRegressionState(points, order);
  };

  const updateRegressionState = (points: number[][], order: number) => {
    const regression = Regression.polynomialRegression(
      points,
      order,
      SETTINGS.precisionCoefficient
    );
    setCoefficients(regression.equation);
    setEquation(regression.string);
    setR2(regression.r2);
  };

  /***************************************************************************/
  /* Input Handling                                                          */
  /***************************************************************************/
  // extract and validate input and then update the state

  const handleCurveNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    updateCurveNameState(event.target.value);
  const handleCurveDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    updateCurveDescriptionState(event.target.value);
  const handleXAxisLabelChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    updateXAxisLabelState(event.target.value);
  const handleYAxisLabelChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    updateYAxisLabelState(event.target.value);
  const handleOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
    updateOrderState(parseInt(event.target.value));

  const handleCurveCoefficientsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    coefficientIndex: number
  ) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || isNaN(parseFloat(value))) {
      value = '0';
    }

    updateCoefficientState(parseFloat(value), coefficientIndex);
  };

  const handlePointCoordinateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    pointIndex: number,
    coordinateIndex: number
  ) => {
    let value = event.target.value;

    // handle invalid input
    if (value === '' || isNaN(parseFloat(value))) {
      value = '0';
    }

    updatePointCoordinateState(parseFloat(value), pointIndex, coordinateIndex);
  };

  /***************************************************************************/
  /* Render                                                                  */
  /***************************************************************************/

  return (
    <div style={{ display: 'flex' }}>
      <div>
        <div
          style={{ width: `${SETTINGS.svg.size.width}px`, height: `${SETTINGS.svg.size.height}px` }}
        >
          <svg
            ref={SVG_REF as any}
            width={SETTINGS.svg.size.width}
            height={SETTINGS.svg.size.height}
            style={{ float: 'left' }}
          >
            <defs>
              <style type="text/css">{`
            circle {
              fill: ${SETTINGS.draggablePoint.color};
            }
            circle.active {
              fill: gray;
              stroke: black;
            }
          `}</style>
            </defs>
          </svg>
        </div>
        <p style={{ width: `${SETTINGS.svg.size.width}px`, padding: '5px', textAlign: 'center' }}>
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
                    step={Math.pow(10, -(SETTINGS.precisionCoefficient - 1))}
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
                  step={Math.pow(10, -(SETTINGS.precisionPoints - 1))}
                  value={point[0]}
                  onChange={e => handlePointCoordinateChange(e, i, 0)}
                />{' '}
                y:{' '}
                <input
                  className="number"
                  type="number"
                  min={yAxis.min}
                  max={yAxis.max}
                  step={Math.pow(10, -(SETTINGS.precisionPoints - 1))}
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
                  value={xAxis.label}
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
                  value={yAxis.label}
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
            rows={20}
            cols={43}
            onChange={e => handleCurveDescriptionChange(e)}
            value={curveDescription}
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default CurveGenerator;
