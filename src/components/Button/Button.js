import React from 'react'

export const Button = ({text, onClick}) => {
  return (
    <button title={text} onClick={onClick}> {text} </button>
  )
};
