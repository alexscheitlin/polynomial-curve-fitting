import * as React from 'react';
import * as d3 from 'd3';
import regression from 'regression';

// polynomial regression made with
// https://github.com/Tom-Alexander/regression-js

const D3Example = () => {
  // round n to x decimal places
  const round = n => {
    const x = PRECISION_POINTS;
    const y = Math.pow(10, x);
    return Math.round(n * y) / y;
  };

  // size of final SVG
  const SVG_SIZE = { width: 500, height: 300 };

  // max values of both axis
  const X_MAX = 10;
  const Y_MAX = 10;

  // precision of the polynomial's coefficients and the draggable points
  // (i.e., number of significant figures)
  // maybe this should be the same as the points of the regression have the
  // same precision as the polynomial's coefficients
  const PRECISION_COEFFICIENT = 4;
  const PRECISION_POINTS = 2;

  // initial order of the polynomial
  const startOrder = 2;

  // create random points based on the initial order
  const startPoints = d3
    .range(0, startOrder + 1)
    .map(i => [(X_MAX / startOrder) * i, round(Math.random() * Y_MAX)]);

  const SVG_REF = React.useRef();
  const [order, setOrder] = React.useState(startOrder);
  const [equation, setEquation] = React.useState('y = f(x)');
  const [r2, setR2] = React.useState(0.0);
  const [points, setPoints] = React.useState(startPoints);

  React.useEffect(() => init(), [order]);

  const sortPointsByX = points => points.sort((a, b) => a[0] - b[0]);

  const polynomialRegression = (points, order) =>
    regression.polynomial(points, { order: order, precision: PRECISION_COEFFICIENT });

  const calculateCurvePoints = (points, order) => {
    const frequency = 7;
    return [...Array(frequency * X_MAX + 1).keys()]
      .map(x => x / frequency)
      .map(x => polynomialRegression(points, order).predict(x));
  };

  let curvePoints = calculateCurvePoints(points, order);

  // remove point form points array (in place)
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

    points.push([round(newX), round(newY)]);
    points = sortPointsByX(points);
  };

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

  const init = () => {
    // https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2
    // define svg and and add it to the dom
    let svg = d3.select(SVG_REF.current);

    // set properties
    let margin = { top: 20, right: 20, bottom: 30, left: 50 };
    let width = +svg.attr('width') - margin.left - margin.right;
    let height = +svg.attr('height') - margin.top - margin.bottom;

    // create random points
    //let points = d3.range(1, 5).map(i => [(i * width) / 10, 50 + Math.random() * (height - 100)]);

    // define range of x and y axis
    let x = d3.scaleLinear().rangeRound([0, width]);
    let y = d3.scaleLinear().rangeRound([height, 0]);

    // set x and y axis
    let xAxis = d3.axisBottom(x);
    let yAxis = d3.axisLeft(y);

    let line = d3
      .line()
      .x(d => x(d[0]))
      .y(d => y(d[1]));

    // https://stackoverflow.com/questions/46171347/how-to-fit-a-polynomial-curve-with-d3
    // https://github.com/d3/d3-shape/blob/master/README.md#curves
    // line = d3
    //   .line()
    //   .x(d => x(d[0]))
    //   .y(d => y(d[1]))
    //   .curve(d3.curveCardinal.tension(0));
    //.curve(d3.curveNatural);
    //.curve(d3.curveCatmullRom);
    //.curve(d3.curveBasis);

    // define drag events (methods defined at the end of this )
    let drag = d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    svg
      .append('rect')
      .attr('class', 'zoom')
      .attr('cursor', 'default')
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var focus = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    x.domain(d3.extent(points, d => d[0]));
    y.domain(d3.extent(points, d => d[1]));

    x.domain([0, X_MAX]);
    y.domain([0, Y_MAX]);

    // draw curve
    focus
      .append('path')
      .datum(curvePoints)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // draw draggable points
    focus
      .selectAll('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('r', 8.0)
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .style('cursor', 'pointer');
    //.style('fill', 'steelblue');

    // add drag behaviour to all dragable points
    focus.selectAll('circle').call(drag);

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

    const regression = polynomialRegression(points, order);
    setEquation(regression.string);
    setR2(regression.r2);

    // init
    drawCurvePoints(d3, focus, x, y, curvePoints);

    function dragstarted(d) {
      d3.select(this)
        .raise()
        .classed('active', true);
    }

    function dragged(d) {
      // change coordinate of points
      d[0] = round(x.invert(d3.event.x));
      d[1] = round(y.invert(d3.event.y));

      // update location of point
      d3.select(this)
        .attr('cx', x(d[0]))
        .attr('cy', y(d[1]));

      const regression = polynomialRegression(points, order);
      setEquation(regression.string);
      setR2(regression.r2);
      console.log(regression);

      curvePoints = calculateCurvePoints(points, order);

      focus.select('path').attr('d', line);

      drawCurvePoints(d3, focus, x, y, curvePoints);

      // sort points to not have "invalid" functions
      setPoints(sortPointsByX(points));
    }

    function dragended(d) {
      d3.select(this).classed('active', false);
    }
  };

  const updateOrder = e => {
    const newOrder = parseInt(e.target.value);

    // add or remove points until there are one more point than the new order
    let cPoints = JSON.parse(JSON.stringify(points)); // deep copy
    while (cPoints.length - 1 != newOrder) {
      cPoints.length - 1 < newOrder && addPoint(cPoints);
      cPoints.length - 1 > newOrder && removePoint(cPoints);
    }

    clearSVG();

    setPoints(sortPointsByX(cPoints));
    setOrder(newOrder);
  };

  return (
    <div style={{ display: 'flex' }}>
      <svg ref={SVG_REF} width={SVG_SIZE.width} height={SVG_SIZE.height} style={{ float: 'left' }}>
        <defs>
          <style type="text/css">{`
            circle{
              fill: steelblue;
            }
            circle.active{
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
        <pre>
          <div>Order: {JSON.stringify(order)}</div>
          <div>Equation: {JSON.stringify(equation)}</div>
          <div>Coefficient of Determination (R^2): {JSON.stringify(r2)}</div>
          <div>Points:</div>
          <div>
            {JSON.stringify(
              points.map(p => [p[0], p[1]]),
              null,
              2
            )}
          </div>
        </pre>
      </div>
    </div>
  );
};

export default D3Example;
