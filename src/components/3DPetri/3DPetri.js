import React from 'react'
import {Entity, Scene} from "aframe-react"
import * as d3 from "d3"
import {getPos, getRot, getOffsetPos, getOffsetRot} from "../../utils/postionUtils";
import {objectValuesToString} from "../../utils/utils";
import {sum} from 'lodash'

const Petri3D = ({onBarClick, onDishClick, data, dishData, radius, selectedHosts}) => {
  const hscale = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.abs(d.count))])
    .range([0, 5 * (radius / 8)]);

  const getHeight = (d) => {
    return hscale(d.count);
  };

  const count = data.length;

  const renderStackedBars = (d, i) => {
    const pos = getPos(i, count, getHeight(d), radius);
    const rot = getRot(i, count);
    const height = getHeight(d);

    const selectedKeys = Object.keys(d.watchedBy)
      .filter(key => Object.keys(selectedHosts).includes(key))
      .sort();

    const total = sum(selectedKeys.map(key => d.watchedBy[key]));
    const heights = selectedKeys.map(key => height / total * d.watchedBy[key]);
    const offsets = heights.reduce((acc, h, index) => {
      acc.push(acc[index] + h);
      return acc
    }, [0]);
    const positions = heights.map((h, i) => ({...pos, y: offsets[i] + h / 2}));

    return (
      <>
        <Entity
          primitive="a-box"
          className="clickable"
          position={objectValuesToString(pos)}
          rotation={rot}
          height={height + 0.02}
          color="#FFD700"
          opacity="0"
          width="1.02"
          depth="1.02"
          material="transparent: true; side: double;"
          event-set__1={{
            _event: 'mouseenter',
            opacity: "1"
          }}
          event-set__2={{
            _event: 'mouseleave',
            opacity: "0"
          }}
          events={{
            click: () => onBarClick(d.channel)
          }}
        />
        {selectedKeys.map((key, j) => {
          return (
            <Entity
              primitive="a-box"
              position={positions[j]}
              rotation={rot}
              height={heights[j]}
              color={selectedHosts[key]}
              side="double"
            />
          )})}

      </>
    )
  };

  const renderBars = (d, i) => {
    const color = Object.keys(selectedHosts).length === 0
      ? d.count < 0 ? "#B22222" : "#008B8B"
      : "#75736C";

    return (
      <>
        {d.isWatchedBySelected
          ? renderStackedBars(d, i)
          : (
            <Entity
              primitive="a-box"
              className="clickable"
              material="side: double"
              position={objectValuesToString(getPos(i, count, getHeight(d), radius))}
              rotation={getRot(i, count)}
              height={getHeight(d)}
              color={color}
              event-set__1={{
                _event: 'mouseenter',
                color: "#FFD700"
              }}
              event-set__2={{
                _event: 'mouseleave',
                color: color
              }}
              events={{
                click: () => onBarClick(d.channel)
              }}
            />
          )}
        <Entity
          primitive="a-text"
          value={`${d.channel} Value: ${d.count}`}
          color="black"
          align="center"
          side="double"
          opacity={
            Object.keys(selectedHosts).length === 0
            ? 1
            : d.isWatchedBySelected ? 1 : 0.4
          }
          width={radius * 0.7}
          height={radius * 0.7}
          rotation={getOffsetRot(i, count)}
          position={objectValuesToString(getOffsetPos(i, count, radius * 1.2))}
        />
      </>
    )
  };

  const renderMainDish = () => {
    return (
       <Entity
          primitive="a-ring"
          radius-inner={radius - 1}
          radius-outer={radius + 1}
          rotation="-90 0 0"
          material="side:double; transparent: true; opacity: 0.2"
          position="0 0 0"
          color={"white"} // probably refactor
        />
    )
  };

  const renderDish = (d) => {
    const isSelected = Object.keys(selectedHosts).includes(d.data.location);

    return (
      <>
        <Entity
          primitive="a-circle"
          class="clickable"
          radius={d.r}
          rotation="-90 0 0"
          material="side:double; transparent: true"
          opacity={isSelected ? 0.7 : 0.4}
          position={`${d.x} 0 ${d.y}`}
          color={selectedHosts[d.data.location] || (d.data.count > 0 ? "white" : "#75736C")}
          key={d.data.location}
          event-set__1={{
            _event: 'mouseenter',
            transparent: false,
            opacity: 1,
          }}
          event-set__2={{
            _event: 'mouseleave',
            transparent: true,
            opacity: 0.5,
          }}
          events={{
            click: () => onDishClick(d.data.location)
          }}
        >
          <Entity
            primitive="a-text"
            value={d.data.location}
            color="black"
            align="center"
            z-offset={0.1}
            width={d.r * 8}
            height={d.r * 8}
          />
          <Entity
            primitive="a-text"
            value={`Active: ${d.data.count}`}
            color="black"
            align="center"
            z-offset={0.1}
            width={d.r * 6}
            height={d.r * 6}
            position={`0 -${d.r * 0.4} 0`}
          />
        </Entity>
      </>
    )
  };

  return (
    <div style={{height: "100vh", width: "100%", display: "block"}}>
      <div id="button" hidden/>
      <Scene embedded vr-mode-ui="enterVRButton: #button; enterARButton: #button">
        <Entity
          primitive="a-light"
          position="0 9 0"
          type="point"
          intensity={1}
        />
        <Entity
          primitive="a-light"
          position="0 0 0"
          type="ambient"
          intensity={0.7}
        />
        <Entity
          primitive="a-light"
          position="0 -9 0"
          type="point"
          intensity={1}
        />
        <Entity primitive="a-sky" color="darkgray"/>
        {data.map(renderBars)}
        {renderMainDish()}
        {dishData.map(renderDish)}
        <Entity
          primitive="a-camera"
          wasd-controls={`acceleration:${50 * radius}; fly: true`}
          cursor="rayOrigin: mouse"
          fov={45}
          raycaster="objects: .clickable"
        />
      </Scene>
    </div>
  )
};

export default Petri3D
