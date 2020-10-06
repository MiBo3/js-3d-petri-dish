import React, {useEffect} from 'react'
import * as d3 from 'd3'

export const BarChart = ({name}) => {
  useEffect(() => {
    const timeParser = d3.timeParse("%Y-%m");
    const datas = [
      {date: "2020-02-07", value: 53},
      {date: "2020-02-08", value: 65},
      {date: "2020-02-09", value: 69},
      {date: "2020-02-10", value: 44},
      {date: "2020-02-11", value: 76},
      {date: "2020-02-12", value: 63},
    ].map(d => ({...d, time: timeParser(d.time)}));

    // set the dimensions and margins of the graph
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 860 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // set the ranges
    let x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);
    let y = d3.scaleLinear()
      .range([height, 0]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    let svg = d3.select(`#${name}`).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    x.domain(datas.map(function (d) {
      return d.date;
    }));
    y.domain([0, d3.max(datas, function (d) {
      return d.value;
    })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
      .data(datas)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) {
        return x(d.date);
      })
      .attr("width", x.bandwidth())
      .attr("y", function (d) {
        return y(d.value);
      })
      .attr("height", function (d) {
        return height - y(d.value);
      })
      .style("fill", "#435666");


    // add the x Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
      .call(d3.axisLeft(y));
  }, [name]);

  return (
    <div id={name}>
    </div>
  )
};
