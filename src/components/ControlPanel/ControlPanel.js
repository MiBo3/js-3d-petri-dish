import React, {useState} from 'react'
import {Dropdown} from "../Dropdown/Dropdown";
import {DatePicker} from "../DatePicker/DatePicker";
import {VerticalSpacer} from "../VerticalSpacer/VerticalSpacer";
import {AnimationMode, ViewMode} from "../../App";
import {Multiselect} from "../MultiSelect/MultiSelect";
import {Button} from "../Button/Button";
import {Checkbox} from "../Checkbox/Checkbox";

export const ControlPanel = ({
                               viewMode,
                               onViewModeChange,
                               timestamps,
                               timeWindow,
                               onFromChange,
                               onToChange,
                               animationMode,
                               toggleAnimationMode,
                               filterOptions,
                               filterSelected,
                               onFilterChange,
                               onValueFilterSubmit,
                               onStepChange,
                               onWaitChange,
                               showInactiveLocations,
                               onShowInactiveLocationsChange,
                             }) => {
  const dropdownOptions = [
    {value: ViewMode.SWITCH, label: "Channel switch"},
    {value: ViewMode.CURRENT_VIEWS, label: "Current views"}
  ];

  const animationModes = [
    {value: AnimationMode.STATIC, label: "Static view"},
    {value: AnimationMode.ANIMATE, label: "Animated view"},
  ];

  const onClearClick = () => {
    onFilterChange([])
  };

  const [valueFilter, setValueFilter] = useState({gt: "", lt: ""});
  const [step, setStep] = useState("");
  const [waitTime, setWaitTime] = useState("5");

  // TODO: regex can be put right inside the input
  const stepInputRegex = /^-?[0-9]*$/;
  const onStepInputChange = (event) => {
    if (stepInputRegex.test(event.currentTarget.value)) {
      setStep(event.currentTarget.value)
    }
  };

  const waitTimeInputRegex = /^[0-9]*$/;
  const onWaitTimeChange = (event) => {
    if (waitTimeInputRegex.test(event.currentTarget.value)) {
      setWaitTime(event.currentTarget.value)
    }
  };

  const valueFilterRegex = /^-?[0-9]*$/;
  const onValueFilterChange = (attribute, event) => {
    if (valueFilterRegex.test(event.currentTarget.value)) {
      setValueFilter({
        ...valueFilter,
        [attribute]: event.currentTarget.value.length === 0
          ? undefined
          : event.currentTarget.value
      })
    }
  };

  // TODO: could be just one
  const onSubmit = () => {
    onValueFilterSubmit({
      gt: valueFilter.gt === "" ? undefined : +valueFilter.gt,
      lt: valueFilter.lt === "" ? undefined : +valueFilter.lt
    });
    onStepChange(+step);
    onWaitChange(+waitTime);
  };

  return (
    <div style={{padding: "10px"}}>
      <h1 style={{textAlign: "center", margin: 0}}>Control Panel</h1>
      <VerticalSpacer margin="8"/>
      <div style={{alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column"}}>
        <h4>Date pickers</h4>
        {(viewMode === ViewMode.SWITCH || animationMode === AnimationMode.ANIMATE) && (
          <DatePicker
            label="From"
            value={timestamps[0]}
            timeWindow={timeWindow}
            onChange={onFromChange}
          />
        )}
        <DatePicker
          label={viewMode === ViewMode.SWITCH || animationMode === AnimationMode.ANIMATE ? "To" : "Date"}
          value={timestamps[1]}
          timeWindow={timeWindow}
          onChange={onToChange}
        />

        <h4>Channel filters</h4>
        Enabled channels
         <div style={{display: "flex", flexDirection: "row", width: "100%", justifyContent: "center"}}>
          <Multiselect
            options={filterOptions}
            value={filterSelected}
            labelledBy="Channels"
            onChange={onFilterChange}
          />
          <Button text="Clear all" onClick={onClearClick}/>
        </div>
        <VerticalSpacer margin="8"/>
        <p style={{margin: 0}}>Bar value filter</p>
        <div>
          <input
            type="numeric"
            value={valueFilter.gt || ""}
            onChange={(e) => onValueFilterChange('gt', e)}
            placeholder="Greater than"
            size={8}
          />
          {" > value > "}
          <input
            type="numeric"
            value={valueFilter.lt || ""}
            onChange={(e) => onValueFilterChange('lt', e)}
            placeholder="Lower than"
            size={8}
          />
        </div>
        <VerticalSpacer margin="4"/>
        <Button
          text="Apply value filters"
          onClick={onSubmit}
        />

        <h4>View modes</h4>
        <Checkbox onChange={onShowInactiveLocationsChange} checked={showInactiveLocations} label="Show inactive locations" />
        Bar mode
        <Dropdown options={dropdownOptions} value={viewMode} onChange={onViewModeChange}/>
        <VerticalSpacer margin="8"/>
        Animation mode
        <Dropdown options={animationModes} value={animationMode} onChange={toggleAnimationMode}/>

        {animationMode === AnimationMode.ANIMATE && (
          <>
            <h4>Animation settings</h4>
            Animation step (in minutes)
            <input
              type="numeric"
              onChange={onStepInputChange}
              placeholder="Enter a number"
              value={step}
            />
            Animation wait time (in seconds)
            <input
              type="numeric"
              onChange={onWaitTimeChange}
              placeholder="Enter a number"
              value={waitTime}
            />
            <VerticalSpacer margin="4"/>
            <Button
              text="Apply animation settings"
              onClick={onSubmit}
            />
          </>
        )}
      </div>

    </div>
  )
};
