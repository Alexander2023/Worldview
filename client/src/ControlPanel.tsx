import { useState } from 'react';

import './ControlPanel.css';

const OPENED_BOTTOM_POS = '0vh';
const CLOSED_BOTTOM_POS = 'calc(36px - 44vh)';

/**
 * Generates a panel for controlling in-world objects and interactions
 */
function ControlPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSliderOnClick = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  }

  return (
    <div
      id="control-panel"
      style={{bottom: isOpen ? OPENED_BOTTOM_POS : CLOSED_BOTTOM_POS}}
    >
      <div id="control-panel-slider" onClick={handleSliderOnClick} >
          <div id="control-panel-slider-button" />
      </div>
      <div id="control-panel-content" />
    </div>
  )
}

export { ControlPanel };
