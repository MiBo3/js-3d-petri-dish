import React from 'react'

export const VerticalSpacer = (props) =>
  <div style={{marginTop: `${props && props.margin ? props.margin : 5}px`}}/>;
