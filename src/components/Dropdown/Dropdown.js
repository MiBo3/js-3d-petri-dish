import React from 'react'

export const Dropdown = ({options, value, onChange}) => {
  return (
    <select value={value} onChange={onChange}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
};
