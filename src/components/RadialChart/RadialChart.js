import React, {useEffect} from 'react'
import * as d3 from 'd3'
import {getStringTimeAxisRepresentations} from "../../utils/utils";
import {uniq} from "lodash";

export const RadialChart = ({name, data}) => {
  useEffect(() => {
    if (data === null)
      return;

    const width = 700;
    const height = width;

    const margin = 10;
    const innerRadius = width / 5;
    const outerRadius = width / 2 - margin;
    const tickRadius = innerRadius - 20;

    const x = d3.scaleTime()
      .domain([data[0].timestamp, data[data.length - 1].timestamp])
      .range([0, 2 * Math.PI]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => Math.min(d.changedTo, d.changedFrom)), d3.max(data, d => Math.max(d.changedTo, d.changedFrom))])
      .nice()
      .range([innerRadius, outerRadius]);

    const timespan =  data[data.length - 1].timestamp - data[0].timestamp;

    const xAxis = g => g
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .call(g => g.selectAll("g")
        .data(x.ticks())
        .join("g")
        .call(g => g.append("path")
          .attr("stroke", "#000")
          .attr("stroke-opacity", 0.3)
          .attr("d", d => `
              M${d3.pointRadial(x(d), innerRadius)}
              L${d3.pointRadial(x(d), outerRadius)}
            `))
        .call(g => g.append("path")
          .attr("id", (d, i) => i)
          .datum(d => {
            return [d, d + 1]
          })
          .attr("fill", "black")
          .attr("d", ([a, b]) =>
            `
              M${d3.pointRadial(x(a), innerRadius)}
              A${innerRadius},${innerRadius} 0,0,1 ${d3.pointRadial(x(b), innerRadius)}
            `
          ))
        .call(g => g.append("text")
          .text(d => getStringTimeAxisRepresentations(d, timespan))
          .attr("transform", (d, i) => {
            const theta = (i / x.ticks().length) * (2 * Math.PI);
            const [dx, dy] = d3.pointRadial(theta + 0.6, tickRadius);
            return `translate(${dx - 3}, ${dy})`
          })
        ));

    const yAxis = g => g
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .call(g => g.selectAll("g")
        .data(y.ticks(y.domain()[1] < 10? y.domain()[1] : 10).reverse())
        .join("g")
        .attr("fill", "none")
        .call(g => g.append("circle")
          .attr("stroke", "#000")
          .attr("stroke-opacity", 0.2)
          .attr("r", y))
        .call(g => g.append("text")
          .attr("y", d => -y(d))
          .attr("dy", "0.35em")
          .attr("stroke", "#fff")
          .attr("stroke-width", 5)
          .text(x => x.toString())
          .clone(true)
          .attr("y", d => y(d))
          .selectAll(function () {
            return [this, this.previousSibling];
          })
          .clone(true)
          .attr("fill", "currentColor")
          .attr("stroke", "none")));

    const line = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .angle(d => x(d.timestamp));

    const area = d3.areaRadial()
      .curve(d3.curveLinearClosed)
      .angle(d => x(d.timestamp));

    const svg = d3.select(`#${name}`).append("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    svg.append("path")
      .attr("fill", "lightsteelblue")
      .attr("fill-opacity", 0.5)
      .attr("d", area
        .innerRadius(d => innerRadius)
        .outerRadius(d => y(d.changedFrom))
        (data));

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "#435666")
      .attr("stroke-width", 1.5)
      .attr("d", line
        .radius(d => y(d.changedTo))
        (data));

    svg.append("g")
      .call(xAxis);

    svg.append("g")
      .call(yAxis);

    return () => d3.select(`#${name}`).selectAll("svg").remove()
  }, [data]);

  return (
    <div id={name}>
    </div>
  )
};
