import React from 'react'

export const AnimationControls = ({onChange, runAnimation, date}) => {
  return (
    <div style={{
      position: "absolute",
      backgroundColor: "black",
      bottom: 0,
      left: "49%",
      width: "164px",
      height: "82px",
      color: "white",
      textAlign: "center",
      fontSize: "32px",
      opacity: "0.7",
      cursor: "pointer",
    }} onClick={onChange}>
      <span style={{fontSize: "32px", display: "block"}}>{runAnimation ? "Stop" : "Start"}</span>
      <span style={{fontSize: "18px", display: "block"}}>{date.toLocaleString("sk-SK")}</span>
    </div>
  )
};
