import * as d3 from 'd3';

import * as Utils from './utils';

/*****************************************************************************/
/* Drawing on an SVG with D3                                                 */
/*                                                                           */
/* API: https://github.com/d3/d3/blob/master/API.md                          */
/*****************************************************************************/

/*****************************************************************************/
/* Draw on the svg itself                                                    */
/*****************************************************************************/

export const drawGraphTitle = (
  svg: d3.Selection<d3.BaseType, any, HTMLElement, any>,
  graphMargin: { top: number; right: number; bottom: number; left: number },
  graphSize: { width: number; height: number },
  title: string,
  color: string,
  fontFamily: string,
  fontSize: number
) => {
  svg
    .append('text')
    .attr('id', 'curve-name')
    .attr(
      'transform',
      'translate(' + (graphSize.width / 2 + graphMargin.left) + ', ' + graphMargin.top / 2 + ')'
    )
    .attr('font-family', fontFamily)
    .attr('font-size', `${fontSize}rem`)
    .attr('font-weight', 'bold')
    .attr('fill', color)
    .style('text-anchor', 'middle')
    .text(title);
};

export const drawAxisLables = (
  svg: d3.Selection<d3.BaseType, any, HTMLElement, any>,
  graphMargin: { top: number; right: number; bottom: number; left: number },
  graphSize: { width: number; height: number },
  xAxisLabel: string,
  yAxisLabel: string,
  color: string,
  fontFamily: string,
  fontSize: number
) => {
  // based on: https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
  svg
    .append('text')
    .attr('id', 'x-axis-label')
    .attr(
      'transform',
      'translate(' +
        (graphSize.width / 2 + graphMargin.left) +
        ', ' +
        (graphSize.height + graphMargin.top + graphMargin.bottom) +
        ')'
    )
    .attr('font-family', fontFamily)
    .attr('font-size', `${fontSize}rem`)
    .attr('fill', color)
    .style('text-anchor', 'middle')
    .text(xAxisLabel);

  // text label for the y axis
  svg
    .append('text')
    .attr('id', 'y-axis-label')
    .attr(
      'transform',
      'rotate(-90), translate(' +
        (-graphSize.height / 2 - graphMargin.top) +
        ', ' +
        graphMargin.left / 2 +
        ')'
    )
    .attr('font-family', fontFamily)
    .attr('font-size', `${fontSize}rem`)
    .attr('fill', color)
    .style('text-anchor', 'middle')
    .text(yAxisLabel);
};

/*****************************************************************************/
/* Draw on the graph group                                                   */
/*****************************************************************************/

// draw the grid for both the x and y axes
export const drawGrid = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  graphSize: { width: number; height: number }
) => {
  // based on: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218

  const color = 'lightgray';
  const numberOfLines = 10;
  const tickPadding = 10;

  const xGrid = d3
    .axisBottom(xScale)
    .ticks(numberOfLines)
    .tickPadding(tickPadding)
    .tickSizeInner(-graphSize.height)
    .tickSizeOuter(0);
  const yGrid = d3
    .axisLeft(yScale)
    .ticks(numberOfLines)
    .tickPadding(tickPadding)
    .tickSizeInner(-graphSize.width)
    .tickSizeOuter(0);

  // hide ticks with: .tickFormat(() => '')

  const grid = graph.append('g').attr('id', 'grid');

  // draw x grid lines
  grid
    .append('g')
    .attr('id', 'grid-x')
    .attr('class', 'grid')
    .attr('transform', 'translate(0,' + graphSize.height + ')')
    .call(xGrid);

  // draw y grid lines
  grid.append('g').attr('id', 'grid-y').attr('class', 'grid').call(yGrid);

  // draw border around graph
  grid
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', graphSize.width)
    .attr('height', graphSize.height)
    .attr('fill', 'transparent')
    .attr('stroke-width', 2)
    .attr('stroke', '#cccccc');

  // style grid
  d3.selectAll('g.grid g.tick').select('line').attr('stroke', color);
  d3.selectAll('g.grid').select('path').attr('stroke', color); // hide outer axis lines
};

// draw both the x and y axes through 0/0 spanning the whole graph
export const drawAxesOnGraph = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  graphSize: { width: number; height: number }
) => {
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
    .attr('y2', graphSize.height)
    .attr('stroke', color)
    .attr('stroke-width', lineWidth)
    .attr('transform', 'translate(' + xScale(0) + ' , 0)');

  // y axis
  axes
    .append('g')
    .attr('id', 'axis-in-y')
    .append('line')
    .attr('x1', 0)
    .attr('x2', graphSize.width)
    .attr('stroke', color)
    .attr('stroke-width', lineWidth)
    .attr('transform', 'translate(0, ' + yScale(0) + ')');
};

// draw both the x and y axes around the graph (not necessarily through 0/0))
export const drawAxesAroundGraph = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  graphSize: { width: number; height: number }
) => {
  // set position of the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  const axes = graph.append('g').attr('id', 'axes-out');

  // draw x axis
  axes
    .append('g')
    .attr('id', 'axis-out-x')
    .attr('transform', 'translate(0,' + graphSize.height + ')')
    .call(xAxis);

  // draw y axis
  axes.append('g').attr('id', 'axis-out-y').call(yAxis);
};

export const drawInitialCurve = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  curvePoints: number[][],
  color: string,
  strokeWidth: number
) => {
  const line = d3
    .line<any>()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  const initialCurve = graph.append('g').attr('id', 'initial-curve');

  initialCurve
    .append('path')
    .datum(curvePoints)
    .attr('id', 'initial-curve-path')
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', strokeWidth)
    .attr('d', line);
};

export const drawCurvePoints = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  curvePoints: number[][],
  color: string
) => {
  // remove old points
  d3.select('svg').select('g').selectAll('ellipse').remove();

  // draw new points
  graph
    .selectAll('ellipse')
    .data(curvePoints)
    .enter()
    .append('ellipse')
    .attr('cx', d => xScale(d[0]))
    .attr('cy', d => yScale(d[1]))
    .attr('rx', 2.0)
    .attr('ry', 2.0)
    .style('fill', color);
};

export const drawCurveLines = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  curvePoints: number[][],
  color: string,
  strokeWidth: number
) => {
  // remove old lines
  d3.select('svg').select('g').select('#curve').remove();

  const curve = graph.append('g').attr('id', 'curve');

  const line = d3
    .line<any>()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  // draw new lines
  curve
    .append('path')
    .datum(curvePoints)
    .attr('id', 'curve-path')
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', strokeWidth)
    .attr('d', line);
};

export const addCrosshair = (
  graph: d3.Selection<SVGGElement, any, HTMLElement, any>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  graphSize: { width: number; height: number },
  color: string
) => {
  // based on
  // https://stackoverflow.com/questions/38687588/add-horizontal-crosshair-to-d3-js-chart
  const lineWidth = 1.0;
  const dashes = '3 3'; // width of one dash and space between two dashes

  const crosshair = graph.append('g').attr('id', 'crosshair');

  const transpRect = crosshair
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', graphSize.width)
    .attr('height', graphSize.height)
    .attr('fill', 'white')
    .attr('opacity', 0);

  const verticalLine = crosshair
    .append('line')
    .attr('id', 'crosshair-vertcal')
    .attr('y1', 0)
    .attr('y2', graphSize.height)
    .attr('opacity', 0)
    .attr('stroke', color)
    .attr('stroke-width', lineWidth)
    .attr('pointer-events', 'none')
    .style('stroke-dasharray', dashes);

  const horizontalLine = crosshair
    .append('line')
    .attr('id', 'crosshair-horizontal')
    .attr('x1', 0)
    .attr('x2', graphSize.width)
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

  const mouseMove = (
    _datum: any, // won't be used here but needs to be declared as `index` and `nodes` are needed => ignore `datum`
    index: number,
    nodes: SVGRectElement[] | d3.ArrayLike<SVGRectElement>
  ) => {
    const node = nodes[index];
    const mouse = d3.mouse(node);
    const mouseX = mouse[0];
    const mouseY = mouse[1];

    verticalLine.attr('x1', mouseX).attr('x2', mouseX).attr('opacity', 1);

    horizontalLine.attr('y1', mouseY).attr('y2', mouseY).attr('opacity', 1);

    text
      .attr('x', () => mouseX)
      .attr('y', () => mouseY)
      .text(
        () =>
          `x: ${Utils.round(xScale.invert(mouseX), 2)}, y: ${Utils.round(yScale.invert(mouseY), 2)}`
      )
      .attr('opacity', 1);
  };

  const mouseOut = () => {
    verticalLine.attr('opacity', 0);
    horizontalLine.attr('opacity', 0);
    text.attr('opacity', 0);
  };

  transpRect.on('mousemove', (d, i, n) => mouseMove(d, i, n)).on('mouseout', () => mouseOut());
};
