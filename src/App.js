import React, {useEffect, useMemo, useRef, useState} from 'react';

import {ControlPanel} from "./components/ControlPanel/ControlPanel";
import Sidebar from "react-sidebar";
import "aframe"
import "aframe-event-set-component"
import {
  getSingleChannelViewSwitchStatistics,
  computeTimestampStats,
  getSingleTimestampViewSwitchStatistics,
  getSingleChannelViewerCountOverDay,
  aggregateLocationViewership,
  getSingleTimestampCurrentViewersStatistics, loadData, prepareStats, extractAllChannelIps, extractAllLocationIps
} from "./utils/utils";
import {ChannelDetail} from "./components/ChannelDetail/ChannelDetail";
import {hierarchy, pack} from "d3"
import Petri3D from "./components/3DPetri/3DPetri";
import moment from "moment";
import * as d3 from "d3";
import {AnimationControls} from "./components/AnimationControls/AnimationControls";
import { MINUTES_IN_MSEC, SECONDS_IN_MSEC } from "./consts/timeConsts";
import {ColorPicker} from "./components/ColorPicker/ColorPicker";

export const ViewMode = {
  SWITCH: 'switch',
  CURRENT_VIEWS: 'views',
};

export const AnimationMode = {
  ANIMATE: 'animate',
  STATIC: 'static',
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedHosts, setSelectedHosts] = useState({});
  const [recentlySelectedHost, setRecentlySelectedHost] = useState(null);
  const [mode, setMode] = useState(ViewMode.SWITCH);
  const [animationMode, setAnimationMode] = useState(AnimationMode.STATIC);
  const [runAnimation, setRunAnimation] = useState(false);
  const [step, setStep] = useState(0);
  const [waitTime, setWaitTime] = useState(5);

  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [previousComputed, setPreviousComputed] = useState({hosts: {}, channels: {}});
  const [currentComputed, setCurrentComputed] = useState({hosts: {}, channels: {}});

  const [showInactiveLocations, setShowInactiveLocations] = useState(false);

  const [channelDetailDay, setChannelDetailDay] = useState();
  const timestamps = useMemo(() => loadData(), []);
  const precomputedTimestamps = useMemo(() => prepareStats(timestamps), []);

  // TODO: do not compute this twice
  const [allChannelOptions, setAllChannelOptions] = useState(
    extractAllChannelIps(precomputedTimestamps).map(ip => ({value: ip, label: ip})));

  const [selectedChannelOptions, setSelectedChannelOptions] = useState(
    extractAllChannelIps(precomputedTimestamps).map(ip => ({value: ip, label: ip})));

  const allLocations = useMemo(() => extractAllLocationIps(precomputedTimestamps), []);

  const [valueFilter, setValueFilter] = useState({gt: undefined, lt: undefined});

  const toRef = useRef(to);
  toRef.current = to;

  /*
       INITIALIZATION
   */
  useEffect(() => {
    setFrom(precomputedTimestamps[1].timestamp);
    setTo(precomputedTimestamps[2].timestamp);
    setChannelDetailDay({
      from: moment(precomputedTimestamps[0].timestamp).startOf('day'),
      to: moment(precomputedTimestamps[0].timestamp).endOf('day')
    });
  }, [precomputedTimestamps]);

  const window = {
    from: precomputedTimestamps[0].timestamp,
    to: precomputedTimestamps[precomputedTimestamps.length - 1].timestamp
  };
  /*
      DATA COMPUTATIONS
   */
  const radiusScaler = d3.scaleLinear()
    .domain([2, 160])
    .range([5, 100]);

  // channel switch data for a single timestamp for all the channels
  let AggSwitchData = useMemo(() =>
      mode === ViewMode.SWITCH
        ? getSingleTimestampViewSwitchStatistics(
        previousComputed,
        currentComputed,
        selectedHosts,
        selectedChannelOptions.map(o => o.value),
        valueFilter
        )
        : getSingleTimestampCurrentViewersStatistics(
        currentComputed,
        selectedHosts,
        selectedChannelOptions.map(o => o.value),
        valueFilter
        ),
    [mode, selectedHosts, previousComputed, currentComputed, selectedChannelOptions, valueFilter]);


  const locations = aggregateLocationViewership(currentComputed, allLocations, showInactiveLocations);
  const radius = radiusScaler(Object.keys(AggSwitchData).length);

  const dishData = useMemo(() => {
    const root = hierarchy({
      id: -1,
      // inactive locations need to have a value of at least 1, otherwise pack layout fails
      children: showInactiveLocations ? locations.map(d => ({count: d.count + 1, location: d.location})) : locations
    })
      .sum(d => d.count);

    pack().size([radius * 1.75, radius * 1.75])(root);

    // TODO: why is this needed here?
    if (!root.children)
      return [];

    return root.children.map(circle => ({
      ...circle,
      x: circle.x - 0.9 * radius,
      y: circle.y - 0.9 * radius,
      data: showInactiveLocations ? {...circle.data, count: circle.data.count - 1} : circle.data
    }))
  }, [currentComputed, radius, showInactiveLocations]);

  // switch data for one day for a single channel
  // extend for view data
  const channelSwitchData = useMemo(() =>
      selectedChannel && channelDetailDay
        ? getSingleChannelViewSwitchStatistics(precomputedTimestamps,
        timestamps,
        selectedChannel,
        channelDetailDay.from,
        channelDetailDay.to
        )
        : [],
    [selectedChannel, channelDetailDay]);

  // view count data for a single channel over all the data per hour
  const dayViewCount = useMemo(() =>
    selectedChannel && channelDetailDay
      ? getSingleChannelViewerCountOverDay(precomputedTimestamps,
      timestamps,
      selectedChannel,
      channelDetailDay.from,
      channelDetailDay.to
      )
      : [], [selectedChannel, channelDetailDay]);

  /*
      CHANGE HANDLERS
   */
  // compute stats for "FROM" timestamp
  useEffect(() => {
    if (!from) {
      setPreviousComputed(precomputedTimestamps[0]);
      return
    }

    setPreviousComputed(computeTimestampStats(precomputedTimestamps, timestamps, from))
  }, [from]);

  // compute stats for "TO" timestamp
  useEffect(() => {
    if (!to) {
      setPreviousComputed(precomputedTimestamps[1]);
      return
    }

    setCurrentComputed(computeTimestampStats(precomputedTimestamps, timestamps, to))
  }, [to]);

  const animate = () => {
    setFrom(toRef.current);
    setTo(toRef.current + (step * MINUTES_IN_MSEC));
  };

  useEffect(() => {
    if (animationMode === AnimationMode.STATIC || !runAnimation) {
      return;
    }

    const timeout = setInterval(animate, waitTime * SECONDS_IN_MSEC);

    return () => clearInterval(timeout);
  }, [animationMode, step, runAnimation, waitTime]);

  const onBarClick = (ip) => {
    setSelectedChannel(ip);
  };

  const onCloseClicked = () => {
    setSelectedChannel(null)
  };

  const onDishClick = (ip) => {
    if (Object.keys(selectedHosts).some(h => h === ip)) {
      const hosts = Object.assign({}, selectedHosts);
      delete hosts[ip];
      setSelectedHosts(hosts);
    } else {
      setRecentlySelectedHost(ip);
    }
  };

  const onViewModeChange = (event) => {
    setMode(event.currentTarget.value);
  };

  const onToChange = (m) => {
    if (m.valueOf() > from)
      setTo(m.valueOf())
  };

  const onFromChange = (m) => {
    if (m.valueOf() < to)
      setFrom(m.valueOf())
  };

  const toggleAnimationMode = (event) => {
    setRunAnimation(false);
    setAnimationMode(event.currentTarget.value);
  };

  const toggleAnimationState = () => {
    setRunAnimation(!runAnimation);
  };

  const onChannelDetailDayChange = (newDate) => {
    setChannelDetailDay(newDate)
  };

  const onSelectedChannelsChange = (channels) => setSelectedChannelOptions(channels);

  const onSetHostColor = (color) => {
    setSelectedHosts({...selectedHosts, [recentlySelectedHost]: color});
    setRecentlySelectedHost(null);
  };

  const onCloseColorPicker = () => setRecentlySelectedHost(null);

  return (
    <>
      {recentlySelectedHost && (
        <div style={{position: "absolute", left: "47%", width: "200px", height: "200px", zIndex: 1, bottom: "200px"}}>
          <ColorPicker onClose={onCloseColorPicker} onSubmit={onSetHostColor}/>
        </div>
      )}
      <Petri3D
        onBarClick={onBarClick}
        onDishClick={onDishClick}
        data={AggSwitchData}
        dishData={dishData}
        radius={radius}
        selectedHosts={selectedHosts}
      />
      {selectedChannel && (
        <ChannelDetail
          open
          ip={selectedChannel}
          radialData={channelSwitchData}
          lineData={dayViewCount}
          onClose={onCloseClicked}
          day={channelDetailDay}
          onDayChange={onChannelDetailDayChange}
          timeWindow={window}
          tableHeaders={['Location', 'Count']}
          tableData={
            AggSwitchData.find(data => data.channel === selectedChannel).watchedBy
          } // TODO: extract to utils, watchedBy for everyone, just filter it for dish
          tableColors={selectedHosts}
        />
      )}
      <Sidebar
        sidebar={
          <ControlPanel
            viewMode={mode}
            onViewModeChange={onViewModeChange}
            timestamps={[from, to]}
            onToChange={onToChange}
            onFromChange={onFromChange}
            animationMode={animationMode}
            toggleAnimationMode={toggleAnimationMode}
            timeWindow={window}
            filterOptions={allChannelOptions}
            filterSelected={selectedChannelOptions}
            onFilterChange={onSelectedChannelsChange}
            onValueFilterSubmit={setValueFilter}
            onStepChange={setStep}
            onWaitChange={setWaitTime}
            showInactiveLocations={showInactiveLocations}
            onShowInactiveLocationsChange={() => setShowInactiveLocations(!showInactiveLocations)}
          />
        }
        open={sidebarOpen}
        onSetOpen={() => setSidebarOpen(!sidebarOpen)}
        shadow={false}
        styles={{
          sidebar: {
            position: "fixed",
            height: "100vh",
            backgroundColor: "white",
            width: "45%"
          },
          overlay: {
            backgroundColor: "transparent",
          },
          root: {
            backgroundColor: "transparent",
            left: sidebarOpen ? 0 : "90%",
            height: "30px",
          },
          content: {
            height: "100%",
            width: "100%",
            pointerEvents: "auto"
          }
        }}
        pullRight
      >
        {!sidebarOpen && (
          <div onClick={() => setSidebarOpen(true)} style={{
            cursor: "pointer",
            backgroundColor: "white",
            textAlign: "center",
            height: "100%",
            width: "100%"
          }}>
            Controls
          </div>
        )}
      </Sidebar>
      {animationMode === AnimationMode.ANIMATE && (
          <AnimationControls runAnimation={runAnimation} onChange={toggleAnimationState} date={new Date(to)}/>
        )
      }
    </>
  );
};

export default App;

