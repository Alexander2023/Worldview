import { Canvas } from '@react-three/fiber';
import { useCallback, useContext, useEffect, useState } from 'react';

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

  const handleAddBoundaryBox = useCallback((key: number, value: THREE.Box3) => {
    setBoundaryBoxes(prevBoundaryBoxes => {
      return new Map([...prevBoundaryBoxes, [key, value]]);
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
      setAvatars(newAvatars);
    });
  }, [socket]);

  return (
    <>
      <ControlPanel />
      <Canvas>
        <Room
          handleAddBoundaryBox={handleAddBoundaryBox}
          handleRemoveBoundaryBox={handleRemoveBoundaryBox}
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
