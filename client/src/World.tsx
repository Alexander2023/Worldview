import { Canvas } from '@react-three/fiber';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Box3, Object3D, Vector3 } from 'three';
import imageCompression from 'browser-image-compression';

import { Avatar as AvatarType, Screen } from '../../shared/types';
import { Avatar } from './Avatar';
import { SocketContext } from './context/socket';
import { ControlPanel } from './ControlPanel';
import { Room } from './Room';
import { ScreenConfig } from './types';
import { User } from './User';
import { useWebRTC } from './useWebRTC';

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

  const {socketIdToRemoteUserMedia, pauseMedia, resumeMedia} = useWebRTC();

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
        setScreenConfig({
          file: file,
          dimensions: computeWorldDimensions(image.width, image.height)
        });
      };

      image.onerror = () => {
        console.log('failed to load screen config file as image');
      };

      // @ts-ignore
      // readAsDataURL returns a string for result property
      image.src = fileReader.result;
    };

    fileReader.onerror = () => {
      console.log('failed to load screen config file');
    };

    fileReader.readAsDataURL(file);
  };

  const handleChosenScreenPlacement = async (position: Vector3,
      yRotation: number) => {
    if (!screenConfig) {
      return;
    }

    const file = screenConfig.file;
    const dimensions = screenConfig.dimensions;
    setScreenConfig(null);

    const fileReader = new FileReader();

    fileReader.onload = () => {
      const screen: Screen = {
        // @ts-ignore
        // readAsDataURL returns a string for result property
        dataUrl: fileReader.result,
        dimensions: dimensions,
        position: position.toArray(),
        yRotation: yRotation
      }

      setScreens(prevScreens => [...prevScreens, screen]);
      socket.emit('sendScreen', screen);
    };

    fileReader.onerror = () => {
      console.log('failed to load screen placement file');
    };

    try {
      const compressedFile = await imageCompression(file,
          {maxSizeMB: 1});
      fileReader.readAsDataURL(compressedFile);
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    socket.on('receiveScreen', screen => {
      setScreens(prevScreens => [...prevScreens, screen]);
    });

    socket.on('update', newAvatars => {
      setAvatars(prevAvatars => {
        if (JSON.stringify(prevAvatars) === JSON.stringify(newAvatars)) {
          return prevAvatars;
        }

        return newAvatars;
      });
    });

    return () => {
      socket.off('receiveScreen');
      socket.off('update');
    }
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
          screenDimensions={screenConfig ? screenConfig.dimensions : null}
          handleChosenScreenPlacement={handleChosenScreenPlacement}
        />
        {avatars.map(([id, avatar]) => (
          <Avatar
            key={id}
            position={avatar.position}
            yRotation={avatar.yRotation}
            userMedia={socketIdToRemoteUserMedia.get(id)}
            pauseMedia={pauseMedia}
            resumeMedia={resumeMedia}
          />
        ))}
      </Canvas>
    </>
  )
}

export { World };
