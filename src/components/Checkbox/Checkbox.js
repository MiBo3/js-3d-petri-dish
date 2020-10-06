import React from 'react'

export const Checkbox = ({checked, label, onChange}) => {
  return (
    <>
      <label>{label}</label>
      <input type="checkbox" checked={checked} onChange={onChange}/>
    </>
  )
};
