import { Canvas } from '@react-three/fiber';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Box3, Object3D } from 'three';

import { Avatar as AvatarType } from '../../shared/types';
import { Avatar } from './Avatar';
import { SocketContext } from './context/socket';
import { ControlPanel } from './ControlPanel';
import { Room } from './Room';
import { User } from './User';

/**
 * Generates a 3D interactive world
 */
function World() {
  const socket = useContext(SocketContext);

  const [boundaryBoxes, setBoundaryBoxes] = useState(new Map<number,
      THREE.Box3>());
  const [avatars, setAvatars] = useState<[string, AvatarType][]>([]);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

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
      />
      <Canvas>
        <Room
          handleAddBoundaryBox={handleAddBoundaryBox}
          handleRemoveBoundaryBox={handleRemoveBoundaryBox}
          isControlPanelOpen={isControlPanelOpen}
          setIsControlPanelOpen={setIsControlPanelOpen}
        />
        <User boundaryBoxes={boundaryBoxes} />
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
