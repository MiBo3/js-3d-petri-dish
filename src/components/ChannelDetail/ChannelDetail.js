import React, {useState} from 'react'
import Sidebar from "react-sidebar";
import {RadialChart} from "../RadialChart/RadialChart";
import LineChart from "../LineChart/LineChart";
import {DatePicker} from "../DatePicker/DatePicker";
import {KeyValueTable} from "../Table/Table";
import {Button} from "../Button/Button";
import {VerticalSpacer} from "../VerticalSpacer/VerticalSpacer";

export const ChannelDetail = ({onClose, open, radialData, ip, lineData, day, onDayChange, timeWindow, tableHeaders, tableData, tableColors}) => {
  const [from, setFrom] = useState(day.from);
  const [to, setTo] = useState(day.to);

  const onFromChange = (m) => {
    if (m.valueOf() < to.valueOf()) {
      setFrom(m);
    }
  };

  const onToChange = (m) => {
    if (m.valueOf() > from.valueOf()) {
      setTo(m)
    }
  };

  const onSubmit = () => {
    onDayChange({from, to});
  };

  return (
    <Sidebar
      open={open}
      shadow={false}
      pullLeft
      sidebar={
        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <button onClick={onClose}>Close Detail</button>
          <h2>Channel {ip} detail</h2>
          <DatePicker
            label="From"
            value={from}
            timeWindow={timeWindow}
            onChange={onFromChange}
          />
          <DatePicker
            label="To"
            value={to}
            timeWindow={timeWindow}
            onChange={onToChange}
          />
          <VerticalSpacer margin="8px"/>
          <Button onClick={onSubmit} text="Apply time filter" />
          <h3>Details of viewers switching the channel on and off</h3>
          <RadialChart name="radial" data={radialData}/>
          <h3>Number of concurrent viewers over time</h3>
          <LineChart data={lineData}/>
          {Object.keys(tableData).length > 0 && (
            <>
              <h3>Table of current viewers in selected locations</h3>
              <KeyValueTable headers={tableHeaders} data={tableData} colors={tableColors}/>
              <VerticalSpacer margin="10px"/>
            </>
            )}
        </div>
      }
      styles={{
        root: {
          display: open ? "block" : "none",
          width: "45%"
        },
        overlay: {
          display: "none"
        },
        sidebar: {
          position: "fixed",
          height: "100vh",
          backgroundColor: "white",
          width: "45%"
        }
      }}
    >
      <div style={{display: "none"}}/>
    </Sidebar>
  )
};
