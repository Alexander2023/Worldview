import './CreateScreenPage.css';
import { useState } from "react";

interface CreateScreenPageProps {
  setIsControlPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Generates a page for creating in-world screens of images
 */
function CreateScreenPage({setIsControlPanelOpen}: CreateScreenPageProps) {
  const [image, setImage] = useState<File | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImage(event.target.files[0]);
    } else {
      setImage(null);
    }

    setIsPlacing(false);
  };

  const handleSubmitClick = () => {
    if (image) {
      setIsPlacing(true);
      setIsControlPanelOpen(false);
    } else {
      alert('Must choose an image before placement')
    }
  };

  const handleCancelClick = () => {
    setIsPlacing(false);
  };

  return (
    <div id="create-screen-page" >
      <input type="file" accept="image/*" onChange={handleInputChange} />
      {isPlacing ? (
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
