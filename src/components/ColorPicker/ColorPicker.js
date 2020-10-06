import React, {useState} from "react"
import { SketchPicker } from 'react-color';
import {Button} from "../Button/Button";

export const ColorPicker = ({onSubmit, onClose}) => {
  const [color, setColor] = useState("#000000");

  return (
    <>
      <SketchPicker
        onChangeComplete={event => setColor(event.hex)}
        color={color}
        disableAlpha
      />
      <div style={{display: "flex"}}>
      <Button text="Apply" onClick={() => onSubmit(color)} />
      <Button text="Close" onClick={onClose} />
      </div>
    </>
  )
};
