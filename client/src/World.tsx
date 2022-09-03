import { Canvas } from '@react-three/fiber';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Box3, Object3D, Vector3 } from 'three';

import { Avatar as AvatarType, Screen } from '../../shared/types';
import { Avatar } from './Avatar';
import { SocketContext } from './context/socket';
import { ControlPanel } from './ControlPanel';
import { Room } from './Room';
import { ScreenConfig } from './types';
import { User } from './User';

const computeWorldDimensions = (imageWidth: number, imageHeight: number) => {
  const SCREEN_SCALE_FACTOR = 5;
  const maxDimension = Math.max(imageWidth, imageHeight);

  return [SCREEN_SCALE_FACTOR * imageWidth / maxDimension,
      SCREEN_SCALE_FACTOR * imageHeight / maxDimension];
};

/**
 * Generates a 3D interactive world
 */
function World() {
  const socket = useContext(SocketContext);

  const [boundaryBoxes, setBoundaryBoxes] = useState(new Map<number, Box3>());
  const [avatars, setAvatars] = useState<[string, AvatarType][]>([]);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenConfig, setScreenConfig] =
      useState<ScreenConfig | null>(null);

  const handleAddBoundaryBox = useCallback((object3D: Object3D) => {
    const boundaryBox = new Box3();
    boundaryBox.setFromObject(object3D);

    setBoundaryBoxes(prevBoundaryBoxes => {
      return new Map([...prevBoundaryBoxes, [object3D.id, boundaryBox]]);
    });
  }, []);

  const handleRemoveBoundaryBox = useCallback((key: number) => {
    setBoundaryBoxes(prevBoundaryBoxes => {
      const newBoundaryBoxes = new Map(prevBoundaryBoxes);
      newBoundaryBoxes.delete(key);
      return newBoundaryBoxes;
    });
  }, []);

  const handleScreenConfig = (file: File) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const dimensions = computeWorldDimensions(image.width, image.height);

        setScreenConfig({
          file: file,
          width: dimensions[0],
          height: dimensions[1]
        });
      };

      image.onerror = () => {
        console.log('failed to load screen config file');
      };

      // @ts-ignore
      // readAsDataURL returns a string for result property
      image.src = fileReader.result;
    };

    fileReader.readAsDataURL(file);
  };

  const handleChosenScreenPlacement = (position: Vector3,
      yRotation: number) => {
    if (screenConfig) {
      const fileReader = new FileReader();

      fileReader.onload = () => {
        // @ts-ignore
        // readAsDataURL returns a string for result property
        setScreens(prevScreens => [...prevScreens, {
          dataUrl: fileReader.result,
          dimensions: [screenConfig.width, screenConfig.height],
          position: position.toArray(),
          yRotation: yRotation
        }]);

        setScreenConfig(null);
      };

      fileReader.onerror = () => {
        setScreenConfig(null);
        console.log('failed to load screen placement file');
      };

      fileReader.readAsDataURL(screenConfig.file);
    }
  };

  useEffect(() => {
    socket.on('update', newAvatars => {
      setAvatars(prevAvatars => {
        if (JSON.stringify(prevAvatars) === JSON.stringify(newAvatars)) {
          return prevAvatars;
        }

        return newAvatars;
      });
    });
  }, [socket]);

  return (
    <>
      <ControlPanel
        isOpen={isControlPanelOpen}
        setIsOpen ={setIsControlPanelOpen}
        isPlacingScreen={screenConfig !== null}
        setScreenConfig={setScreenConfig}
        handleScreenConfig={handleScreenConfig}
      />
      <Canvas id={"three-canvas"} >
        <Room
          screens={screens}
          handleAddBoundaryBox={handleAddBoundaryBox}
          handleRemoveBoundaryBox={handleRemoveBoundaryBox}
          isControlPanelOpen={isControlPanelOpen}
          setIsControlPanelOpen={setIsControlPanelOpen}
        />
        <User
          boundaryBoxes={boundaryBoxes}
          isPlacingScreen={screenConfig !== null}
          handleChosenScreenPlacement={handleChosenScreenPlacement}
        />
        {avatars.map(([id, avatar]) => (
          <Avatar
            key={id}
            position={avatar.position}
            yRotation={avatar.yRotation}
          />
        ))}
      </Canvas>
    </>
  )
}

export { World };
