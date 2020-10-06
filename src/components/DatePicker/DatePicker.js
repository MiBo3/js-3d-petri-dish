import React from 'react';
import Datetime from 'react-datetime';
import "./DatePickerStyle.css"

export const DatePicker = ({label, value, timeWindow, onChange, timeFormat="HH:mm", dateFormat=true}) => {
  const validateDates = (date) => {
    if (!timeWindow) {
      return true;
    }

    return date.valueOf() >= timeWindow.from && date.valueOf() <= timeWindow.to
  };

  return (
    <>
      {label && (<label style={{marginRight: '5px'}}>{label}</label>)}
      <Datetime
        inputProps={{placeholder: "Click to choose a date"}}
        timeFormat={timeFormat}
        isValidDate={validateDates}
        value={new Date(value)}
        onChange={onChange}
        dateFormat={dateFormat}
      />
    </>
  )
};
