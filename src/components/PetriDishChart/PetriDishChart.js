import React, {useEffect} from 'react'
import * as d3 from 'd3'

export const PetriDishChart = () => {
  let channels = [];

  for (let i = 0; i < 10; i++) {
    channels.push({id: i})
  }

  const tickSize = (2 * Math.PI) / channels.length;
  const arcGenerator = d3.arc()
    .innerRadius(420)
    .outerRadius(449)
    .padAngle(.02)
    .padRadius(100);

  const data = channels.reduce((acc, val) => {
    const last = acc.length - 1;
    acc.push({
      startAngle: last > -1 ? acc[last].endAngle : 0,
      endAngle: last > -1 ? acc[last].endAngle + tickSize : tickSize,
    });
    return acc
  }, []);

  // create the radial of channels
  useEffect(() => {
    d3.select('#petri')
      .selectAll('path')
      .data(data)
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .attr('fill', "#435666")
  }, []);

  const root = d3.hierarchy({"id": -1, children: channels}).sum(d => 10);
  // TODO: fine tune the size so we have the least empty space
  let packLayout = d3.pack().size([800, 800]);
  packLayout(root);

  // create dish insides
  useEffect(() => {
    let nodes = d3.select("#pack")
      .selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', obj => `translate(${obj.x}, ${obj.y})`);

    nodes.append('circle')
    // TODO: size should be done regarding to the amount of people actually watching TV from the location
      .attr('r', obj => obj.r * 0.95)
      .style('fill', "#b1c0cc")
      .style('stroke', "black")
      .style('opacity', '0.5')
      .attr('id', obj => `id-${obj.data.id}`);

    d3.select('#pack')
      .select('circle')
      .style('display', 'none');
  }, []);

  // create connections
  const centroids = data.map(d => {
    const coords = arcGenerator.centroid(d);
    // TODO: 450 is width / 2
    return [coords[0] + 450, coords[1] + 450]
  });

  const lineConnections = [
    {host: 1, channel: 1},
    {host: 2, channel: 1},
    {host: 1, channel: 3},
    {host: 4, channel: 4},
    {host: 1, channel: 5},
    {host: 6, channel: 2},
    {host: 8, channel: 7},
    {host: 1, channel: 8},
    {host: 2, channel: 6},
  ];

  const lineGenerator = d3.line()


  useEffect(() => {
    const points = lineConnections.map(item => {
      const host = d3.select(`#id-${item.host}`).data()[0];
      const channel = centroids[item.channel];
      return [[host.x + 50, host.y + 50], channel]
    });

    const paths = points.map(lineGenerator);

    d3.select("#lines")
      .selectAll('path')
      .data(paths)
      .enter()
      .append('path')
      .attr('d', obj => obj)
      .style('stroke', "black")
      .style('color', 'black')
      .style('opacity', '0.7')
  }, []);


  return (
    <svg width="900" height="900">
      <g id="pack" transform="translate(50, 50)">
      </g>
      <g id="lines">
      </g>
      <g id="petri" transform="translate(450, 450)">
      </g>
    </svg>
  )
};
