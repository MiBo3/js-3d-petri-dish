import React, {useEffect} from 'react'
import * as d3 from 'd3'

const LineChart = ({data, width=500, height=300}) => {

  const margin = {top: 50, right: 50, bottom: 50, left: 50};

  useEffect(() => {
    if (!data || !data.length) {
      return
    }

    const xScale = d3.scaleTime()
      .domain([data[0].date, data[data.length - 1].date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .range([height, 0]);

    const line = d3.line()
      .x(function (d) {
        return xScale(d.date);
      })
      .y(function (d) {
        return yScale(d.count);
      });

    const svg = d3.select("#name")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale)
        .tickValues(yScale.ticks().filter(t => Number.isInteger(t)))
        .tickFormat(d3.format('d')));

    svg.append("g")
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr('stroke', "black")
      .attr("stroke-width", "1.5")
      .attr("d", d => {
        return line(d);
      });

    svg.append("g")
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', function (d) {
        return xScale(d.date);
      })
      .attr('cy', function (d) {
        return yScale(d.count);
      })
      .attr('r', 2)
      .attr('stroke', "blue");

    return () => d3.select('#name').selectAll('g').remove()
  }, [data]);

  return (
    <svg id="name" width={width} height={height}>
    </svg>
  )
};

export default LineChart
