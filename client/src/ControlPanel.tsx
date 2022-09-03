import './ControlPanel.css';
import { CreateScreenPage } from './CreateScreenPage';
import { ScreenConfig, HandleScreenConfig } from './types';

const OPENED_BOTTOM_POS = '0vh';
const CLOSED_BOTTOM_POS = 'calc(36px - 44vh)';

interface ControlPanelProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPlacingScreen: boolean;
  setScreenConfig: React.Dispatch<React.SetStateAction<ScreenConfig | null>>;
  handleScreenConfig: HandleScreenConfig;
}

/**
 * Generates a panel for controlling in-world objects and interactions
 */
function ControlPanel(props: ControlPanelProps) {
  const {isOpen, setIsOpen, isPlacingScreen, setScreenConfig,
      handleScreenConfig} = props;

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
        <CreateScreenPage
          setIsControlPanelOpen={setIsOpen}
          isPlacingScreen={isPlacingScreen}
          setScreenConfig={setScreenConfig}
          handleScreenConfig={handleScreenConfig}
        />
      </div>
    </div>
  )
}

export { ControlPanel };
