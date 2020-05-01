import * as React from 'react';
import * as d3 from 'd3';
import {
  Button,
  Card,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  MenuItem,
  StepConnector,
  TextField,
  Typography,
} from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import * as Drawing from './drawing';
import * as Regression from './regression';
import * as Utils from './utils';
import { Curve, Props, Settings } from './types';
import { defaultProps } from './default-props';
import { initValues } from './init';

const CurveGenerator: React.FC<Props> = (props: Props) => {
  /***************************************************************************/
  /* Drawing Methods                                                         */
  /***************************************************************************/

  // remove all drawings from svg
  const clearSVG = () => {
    const svg = d3.select(SVG_REF.current);

    // remove graph
    svg.select('g').remove();

    // remove title and axis labels
    svg.selectAll('text').remove();

    //.selectAll('*') // remove everything withing the svg tag (including the styling)
  };

  const drawDraggablePoints = (
    svg: d3.Selection<d3.BaseType, any, HTMLElement, any>,
    graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
    curve: Curve,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    radius: number
  ) => {
    // remove old points
    svg.select('g').select('g#draggable-points').remove();

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
      .data(curve.points)
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

      const newCurvePoints = Regression.generateCurvePoints(
        curve.points,
        curve.polynomialOrder,
        curve.xAxis.min,
        curve.xAxis.max,
        SETTINGS.precisionCoefficient
      );

      const regression = Regression.polynomialRegression(
        curve.points,
        curve.polynomialOrder,
        SETTINGS.precisionCoefficient
      );

      setCurve({
        ...curve,
        coefficients: regression.equation,
        curvePoints: newCurvePoints,
        equation: regression.string,
        points: Utils.sortPointsByX(curve.points), // sort points to not have "invalid" functions
        r2: regression.r2,
      });

      if (SETTINGS.showDottedCurve) {
        Drawing.drawCurvePoints(svg, graph, xScale, yScale, newCurvePoints, SETTINGS.curve.color);
      } else {
        Drawing.drawCurveLines(
          svg,
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
      drawDraggablePoints(svg, graph, curve, xScale, yScale, SETTINGS.draggablePoint.radius);
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

  const addZooming = (graph: d3.Selection<SVGGElement, any, HTMLElement, any>, curve: Curve) => {
    // based on: https://stackoverflow.com/questions/39387727/d3v4-zooming-equivalent-to-d3-zoom-x

    const zoomed = () => {
      const newXDomain = d3.event.transform.rescaleX(SETTINGS.xScale).domain();
      const newYDomain = d3.event.transform.rescaleY(SETTINGS.yScale).domain();
      const newXAxis = {
        ...curve.xAxis,
        min: Utils.round(newXDomain[0], 0),
        max: Utils.round(newXDomain[1], 0),
      };
      const newYAxis = {
        ...curve.yAxis,
        min: Utils.round(newYDomain[0], 0),
        max: Utils.round(newYDomain[1], 0),
      };

      SETTINGS.xScale.domain([newXAxis.min, newXAxis.max]);
      SETTINGS.yScale.domain([newYAxis.min, newYAxis.max]);

      const newDrawing = Object.assign({}, drawing);
      newDrawing.x = SETTINGS.xScale;
      newDrawing.y = SETTINGS.yScale;

      clearSVG();
      setDrawing(newDrawing);

      const newCurvePoints = Regression.generateCurvePoints(
        curve.points,
        curve.polynomialOrder,
        newXAxis.min,
        newXAxis.max,
        SETTINGS.precisionCoefficient
      );

      const newCurvePointsInitialCurve = Regression.generateCurvePoints(
        initialCurve.points,
        initialCurve.polynomialOrder,
        newXAxis.min,
        newXAxis.max,
        SETTINGS.precisionCoefficient
      );

      const newCurve = { ...curve, curvePoints: newCurvePoints, xAxis: newXAxis, yAxis: newYAxis };
      setCurve(newCurve);

      const newInitialCurve = { ...initialCurve, curvePoints: newCurvePointsInitialCurve };
      setInitialCurve(newInitialCurve);

      draw(newInitialCurve, newCurve);
    };

    const zoom = d3.zoom().on('zoom', () => zoomed());
    graph.call(zoom as any).on('mousedown.zoom', null);
  };

  /***************************************************************************/
  /* Variables                                                               */
  /***************************************************************************/

  const [SETTINGS, INITIAL_CURVE]: [Settings, Curve] = initValues(props, defaultProps);

  interface Drawing {
    svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    graph: d3.Selection<SVGGElement, any, HTMLElement, any>;
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
  }
  const [drawing, setDrawing] = React.useState<Drawing>(); // most likely, this is not best practice

  const SVG_REF = React.useRef(null);
  const [curve, setCurve] = React.useState<Curve>(Utils.deepCopy(INITIAL_CURVE));
  const [initialCurve, setInitialCurve] = React.useState<Curve>(INITIAL_CURVE);

  // initially draw the graph
  React.useEffect(() => draw(initialCurve, curve), []);

  // expose curve on every change
  React.useEffect(() => {
    if (props.curveChange) {
      const _curve = Utils.deepCopy(curve);
      props.curveChange({
        name: _curve.name,
        description: _curve.description,
        xAxis: _curve.xAxis,
        yAxis: curve.yAxis,
        polynomialEquation: Utils.generatePolynomialEquation(_curve.coefficients),
        polynomialOrder: _curve.polynomialOrder,
        coefficients: _curve.coefficients,
        points: _curve.points,
      });
    }
  }, [curve]);

  // needed for zooming and moving the coordinate system
  let dragged = false;
  let diffDragged = [0, 0];

  /***************************************************************************/
  /* Main                                                                    */
  /***************************************************************************/

  const draw = (initialCurve: Curve, curve: Curve) => {
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
    SETTINGS.xScale.domain([curve.xAxis.min, curve.xAxis.max]);
    SETTINGS.yScale.domain([curve.yAxis.min, curve.yAxis.max]);

    SETTINGS.drawGrid &&
      Drawing.drawGrid(
        graph,
        SETTINGS.xScale,
        SETTINGS.yScale,
        SETTINGS.graphSize,
        SETTINGS.graph.grid.color
      );
    Drawing.drawAxesOnGraph(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      SETTINGS.graphSize,
      SETTINGS.graph.axis.color,
      SETTINGS.graph.axis.strokeWidth
    );
    //Drawing.drawAxesAroundGraph(graph, SETTINGS.xScale, SETTINGS.yScale, SETTINGS.graphSize);
    Drawing.drawInitialCurve(
      graph,
      SETTINGS.xScale,
      SETTINGS.yScale,
      initialCurve.curvePoints,
      SETTINGS.initialCurve.color,
      SETTINGS.initialCurve.strokeWidth
    );

    SETTINGS.drawTitle &&
      Drawing.drawGraphTitle(
        svg,
        SETTINGS.graph.margin,
        SETTINGS.graphSize,
        curve.name,
        SETTINGS.graph.title.color,
        SETTINGS.graph.title.fontFamily,
        SETTINGS.graph.title.fontSize
      );

    SETTINGS.drawAxisLabels &&
      Drawing.drawAxisLables(
        svg,
        SETTINGS.graph.margin,
        SETTINGS.graphSize,
        curve.xAxis.label,
        curve.yAxis.label,
        SETTINGS.graph.axis.labels.color,
        SETTINGS.graph.axis.labels.fontFamily,
        SETTINGS.graph.axis.labels.fontSize
      );

    // draw curve points or lines
    if (SETTINGS.showDottedCurve) {
      Drawing.drawCurvePoints(
        svg,
        graph,
        SETTINGS.xScale,
        SETTINGS.yScale,
        curve.curvePoints,
        SETTINGS.curve.color
      );
    } else {
      Drawing.drawCurveLines(
        svg,
        graph,
        SETTINGS.xScale,
        SETTINGS.yScale,
        curve.curvePoints,
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
    SETTINGS.drawDraggablePoints &&
      drawDraggablePoints(
        svg,
        graph,
        curve,
        SETTINGS.xScale,
        SETTINGS.yScale,
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

    addZooming(graph, curve);

    // let the graph be "movable" (aka panning) with the mouse
    const mouseDown = () => {
      d3.select('body').style('cursor', 'move');
      dragged = true;
    };

    const mouseMove = () => {
      if (dragged) {
        // get length of both axes
        const xAxisLength = curve.xAxis.max - curve.xAxis.min;
        const yAxisLength = curve.yAxis.max - curve.yAxis.min;

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
          let newXAxis = curve.xAxis;
          let newYAxis = curve.yAxis;

          if (isDiffXAbove) {
            // shift x domain by drag difference
            const newXDomain = [curve.xAxis.min - diffDragged[0], curve.xAxis.max - diffDragged[0]];

            // set new min and max values of the x axis
            newXAxis = {
              ...curve.xAxis,
              min: Utils.round(newXDomain[0], 0),
              max: Utils.round(newXDomain[1], 0),
            };

            // reset the domain of the global x axis object used to draw with d3
            SETTINGS.xScale.domain([newXAxis.min, newXAxis.max]);
            newDrawing.x = SETTINGS.xScale;

            // reset drag difference of the x coordinate
            diffDragged[0] = 0;
          }

          if (isDiffYAbove) {
            // shift y domain by drag difference
            const newYDomain = [curve.yAxis.min + diffDragged[1], curve.yAxis.max + diffDragged[1]];

            // set new min and max values of the y axis
            newYAxis = {
              ...curve.yAxis,
              min: Utils.round(newYDomain[0], 0),
              max: Utils.round(newYDomain[1], 0),
            };

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
            curve.points,
            curve.polynomialOrder,
            newXAxis.min,
            newXAxis.max,
            SETTINGS.precisionCoefficient
          );

          const newCurvePointsInitialCurve = Regression.generateCurvePoints(
            initialCurve.points,
            initialCurve.polynomialOrder,
            newXAxis.min,
            newXAxis.max,
            SETTINGS.precisionCoefficient
          );

          const newCurve = {
            ...curve,
            curvePoints: newCurvePoints,
            xAxis: newXAxis,
            yAxis: newYAxis,
          };
          setCurve(newCurve);

          const newInitialCurve = { ...initialCurve, curvePoints: newCurvePointsInitialCurve };
          setInitialCurve(newInitialCurve);

          draw(newInitialCurve, newCurve);
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
    const newCurve = { ...curve, name: newValue };
    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  const updateCurveDescriptionState = (newValue: string) => {
    const newCurve = { ...curve, description: newValue };
    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  const updateXAxisLabelState = (newValue: string) => {
    const newCurve = { ...curve, xAxis: { ...curve.xAxis, label: newValue } };
    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  const updateYAxisLabelState = (newValue: string) => {
    const newCurve = { ...curve, yAxis: { ...curve.yAxis, label: newValue } };
    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  const updateOrderState = (newValue: number) => {
    // add or remove points until there is one more point than the new order
    const cPoints = Utils.deepCopy(curve.points);
    while (cPoints.length - 1 != newValue) {
      cPoints.length - 1 < newValue &&
        Utils.addPoint(cPoints, SETTINGS.precisionCoefficient, SETTINGS.precisionPoints);
      cPoints.length - 1 > newValue && Utils.removePoint(cPoints);
    }

    updatePointsState(Utils.sortPointsByX(cPoints), newValue);
  };

  const updateCoefficientState = (newValue: number, coefficientIndex: number) => {
    // update coefficient list (don't update state yet -> is done in updatePointsState)
    const newCoefficients = [...curve.coefficients];
    newCoefficients[coefficientIndex] = newValue;

    // calculate new y values for the x values
    const newPoints = [...curve.points].map(point => {
      point[1] = Utils.round(
        Utils.polynomialValue(point[0], newCoefficients),
        SETTINGS.precisionPoints
      );
      return point;
    });

    updatePointsState(newPoints, curve.polynomialOrder);
  };

  const updatePointCoordinateState = (
    newValue: number,
    pointIndex: number,
    coordinateIndex: number
  ) => {
    // update changed coordinate in points list
    const newPoints = [...curve.points];
    newPoints[pointIndex][coordinateIndex] = newValue;

    updatePointsState(newPoints, curve.polynomialOrder);
  };

  const updatePointsState = (points: number[][], order: number) => {
    // generate new points on the curve and redraw the curve
    const newCurvePoints = Regression.generateCurvePoints(
      points,
      order,
      curve.xAxis.min,
      curve.xAxis.max,
      SETTINGS.precisionCoefficient
    );

    const regression = Regression.polynomialRegression(
      points,
      order,
      SETTINGS.precisionCoefficient
    );

    const newCurve = {
      ...curve,
      curvePoints: newCurvePoints,
      coefficients: regression.equation,
      equation: regression.string,
      r2: regression.r2,
      points: points,
      polynomialOrder: order,
    };

    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  /***************************************************************************/
  /* Input Handling                                                          */
  /***************************************************************************/
  // extract and validate input and then update the state

  const handleCurveNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateCurveNameState(event.target.value);
  const handleCurveDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateCurveDescriptionState(event.target.value);
  const handleXAxisLabelChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateXAxisLabelState(event.target.value);
  const handleYAxisLabelChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => updateYAxisLabelState(event.target.value);
  const handleOrderChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    updateOrderState(parseInt(event.target.value));

  const handleCurveCoefficientsChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleResetZoomClick = () => {
    const initialCurve = Utils.deepCopy(INITIAL_CURVE);
    const newCurvePoints = Regression.generateCurvePoints(
      curve.points,
      curve.polynomialOrder,
      initialCurve.xAxis.min,
      initialCurve.xAxis.max,
      SETTINGS.precisionCoefficient
    );
    const newCurve = {
      ...curve,
      curvePoints: newCurvePoints,
      xAxis: initialCurve.xAxis,
      yAxis: initialCurve.yAxis,
    };
    setCurve(newCurve);

    clearSVG();
    draw(initialCurve, newCurve);
  };

  /***************************************************************************/
  /* Render                                                                  */
  /***************************************************************************/

  const orders = [1, 2, 3, 4, 5, 6];

  const [expanded, setExpanded] = React.useState<string | false>('panel1');

  const handlePanelChange = (panel: string) => (
    event: React.ChangeEvent<{}>,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      /******************/
      /* components     */
      /******************/
      root: {
        '& .MuiTextField-root': {
          margin: theme.spacing(1),
          // width: '25ch',
        },
      },
      heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: 'bold',
        // flexBasis: '33.33%',
        flexShrink: 0,
      },
      svg: {
        width: `${SETTINGS.svg.size.width}px`,
        height: `${SETTINGS.svg.size.height}px`,
      },
      numberInput: {
        width: '110px',
      },
      description: {
        width: `${SETTINGS.svg.size.width}px`,
        padding: '5px',
        marginTop: '10px',
      },
      stepConnector: {
        margin: '15px 0',
      },
      /******************/
      /* single styles  */
      /******************/
      alignSelfCenter: {
        alignSelf: 'center',
      },
      flex: {
        display: 'flex',
      },
      flexColumn: {
        flexDirection: 'column',
      },
      textAlignCenter: {
        textAlign: 'center',
      },
    })
  );

  const classes = useStyles();

  const textFiledMargin = 'dense';

  return (
    <div className={classes.flex}>
      <Card style={{ padding: '0.5rem', marginRight: '2rem' }}>
        <div className={classes.svg}>
          <svg
            ref={SVG_REF as any}
            width={SETTINGS.svg.size.width}
            height={SETTINGS.svg.size.height}
            style={{ float: 'left' }}
            id={SETTINGS.svg.id}
          >
            <defs>
              <style type="text/css">
                {`
                  circle {
                    fill: ${SETTINGS.draggablePoint.color};
                  }
                  circle.active {
                    fill: gray;
                    stroke: black;
                  }
                `}
              </style>
            </defs>
          </svg>
        </div>
        {!SETTINGS.graphOnly && (
          <div className={classes.textAlignCenter}>
            <Typography>{`y = ${Utils.generatePolynomialEquation(curve.coefficients)}`}</Typography>
            <Button variant="contained" onClick={() => handleResetZoomClick()}>
              Reset Zoom
            </Button>
            <Typography className={classes.description}>{curve.description}</Typography>
          </div>
        )}
      </Card>

      {!SETTINGS.graphOnly && (
        <div className={classes.root}>
          <ExpansionPanel expanded={expanded === 'panel1'} onChange={handlePanelChange('panel1')}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className={classes.heading}>Polynomial Equation and Points</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div style={{ marginLeft: '1rem' }}>
                <TextField
                  select
                  label="Select"
                  value={curve.polynomialOrder}
                  onChange={e => handleOrderChange(e)}
                  variant="outlined"
                  margin={textFiledMargin}
                >
                  {orders.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <StepConnector className={classes.stepConnector}></StepConnector>

                <div>
                  {/* <div>
                  <Typography>
                    Polynomial: {`y = ${Utils.generatePolynomialEquation(curve.coefficients)}`}
                  </Typography>
                  <Typography>Equation: {curve.equation}</Typography>
                </div> */}
                  <div className={classes.flex}>
                    <Typography className={classes.alignSelfCenter}>y =</Typography>
                    {curve.coefficients.map((coefficient, i) => {
                      return (
                        <div key={i} className={classes.flex}>
                          <TextField
                            type="number"
                            value={coefficient}
                            onChange={e => handleCurveCoefficientsChange(e, i)}
                            inputProps={{
                              step: Utils.precisionToStepSize(SETTINGS.precisionCoefficient),
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            variant="outlined"
                            margin={textFiledMargin}
                            className={classes.numberInput}
                          />
                          <Typography className={classes.alignSelfCenter}>
                            {Utils.generatePolynomialTerm(curve.coefficients.length, i, 'x')}
                          </Typography>
                        </div>
                      );
                    })}
                  </div>

                  <Typography style={{ color: curve.r2 === 1 ? 'green' : 'red' }}>
                    Coefficient of Determination (R^2): {JSON.stringify(curve.r2)}
                  </Typography>
                </div>

                <StepConnector className={classes.stepConnector}></StepConnector>

                <div>
                  {curve.points.map((point, i) => {
                    return (
                      <div key={i} className={classes.flex}>
                        <Typography className={classes.alignSelfCenter}>P{i + 1}</Typography>
                        <TextField
                          label="X-Coordinate"
                          type="number"
                          value={point[0]}
                          onChange={e => handlePointCoordinateChange(e, i, 0)}
                          inputProps={{
                            min: curve.xAxis.min,
                            max: curve.xAxis.max,
                            step: Utils.precisionToStepSize(SETTINGS.precisionPoints),
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          variant="outlined"
                          margin={textFiledMargin}
                          className={classes.numberInput}
                        />
                        <TextField
                          label="Y-Coordinate"
                          type="number"
                          value={point[1]}
                          onChange={e => handlePointCoordinateChange(e, i, 1)}
                          inputProps={{
                            min: curve.yAxis.min,
                            max: curve.yAxis.max,
                            step: Utils.precisionToStepSize(SETTINGS.precisionPoints),
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          variant="outlined"
                          margin={textFiledMargin}
                          className={classes.numberInput}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel expanded={expanded === 'panel2'} onChange={handlePanelChange('panel2')}>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel2bh-content"
              id="panel2bh-header"
            >
              <Typography className={classes.heading}>Text Settings</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.flexColumn}>
              <TextField
                label="Name"
                variant="outlined"
                type="text"
                value={curve.name}
                onChange={e => handleCurveNameChange(e)}
                placeholder="Curve Name"
              />
              <br></br>
              <TextField
                label="X-Axis"
                variant="outlined"
                type="text"
                value={curve.xAxis.label}
                onChange={e => handleXAxisLabelChange(e)}
                placeholder="X-Axis Label"
              />
              <br></br>
              <TextField
                label="Y-Axis"
                variant="outlined"
                type="text"
                value={curve.yAxis.label}
                onChange={e => handleYAxisLabelChange(e)}
                placeholder="Y-Axis Label"
              />
              <br></br>
              <TextField
                label="Description"
                multiline
                rows={5}
                variant="outlined"
                onChange={e => handleCurveDescriptionChange(e)}
                value={curve.description}
              />
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </div>
      )}
    </div>
  );
};

export default CurveGenerator;
