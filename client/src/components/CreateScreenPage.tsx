import { useEffect, useRef, useState } from "react";

import '../assets/css/CreateScreenPage.css';
import { HandleScreenConfig, ScreenConfig } from '../types';

interface CreateScreenPageProps {
  setIsControlPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPlacingScreen: boolean;
  setScreenConfig: React.Dispatch<React.SetStateAction<ScreenConfig | null>>;
  handleScreenConfig: HandleScreenConfig;
}

/**
 * Generates a page for creating in-world screens of images
 */
function CreateScreenPage(props: CreateScreenPageProps) {
  const {setIsControlPanelOpen, isPlacingScreen, setScreenConfig,
      handleScreenConfig} = props;

  const inputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImage(event.target.files[0]);

      if (isPlacingScreen) {
        handleScreenConfig(event.target.files[0]);
      }
    } else {
      setImage(null);
      setScreenConfig(null);
    }
  };

  const handleSubmitClick = () => {
    if (image) {
      setIsControlPanelOpen(false);
      handleScreenConfig(image);
    } else {
      alert('Must choose an image before placement')
    }
  };

  const handleCancelClick = () => {
    setScreenConfig(null);
  };

  useEffect(() => {
    if (inputRef.current && !isPlacingScreen) {
      inputRef.current.value = '';
      setImage(null);
    }
  }, [isPlacingScreen]);

  return (
    <div id="create-screen-page" >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
      />
      {isPlacingScreen ? (
        <button id="create-screen-cancel" onClick={handleCancelClick} >
          Cancel
        </button>
      ) : (
        <button id="create-screen-place" onClick={handleSubmitClick} >
          Place Screen
        </button>
      )}
    </div>
  )
}

export { CreateScreenPage };
