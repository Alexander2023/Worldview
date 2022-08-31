import './ControlPanel.css';
import { CreateScreenPage } from './CreateScreenPage';

const OPENED_BOTTOM_POS = '0vh';
const CLOSED_BOTTOM_POS = 'calc(36px - 44vh)';

interface ControlPanelProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Generates a panel for controlling in-world objects and interactions
 */
function ControlPanel({isOpen, setIsOpen}: ControlPanelProps) {
  const handleSliderClick = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  return (
    <div
      id="control-panel"
      style={{bottom: isOpen ? OPENED_BOTTOM_POS : CLOSED_BOTTOM_POS}}
    >
      <div id="control-panel-slider" onClick={handleSliderClick} >
          <div id="control-panel-slider-button" />
      </div>
      <div id="control-panel-content" >
        <CreateScreenPage setIsControlPanelOpen={setIsOpen} />
      </div>
    </div>
  )
}

export { ControlPanel };
