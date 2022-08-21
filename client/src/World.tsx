import { Canvas } from '@react-three/fiber';
import { useCallback, useState } from 'react';

import { Room } from './Room';
import { User } from './User';

/**
 * Generates a 3D interactive world
 */
function World() {
  const [boundaryBoxes, setBoundaryBoxes] = useState(new Map<number,
      THREE.Box3>());

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

  return (
    <Canvas>
      <Room
        handleAddBoundaryBox={handleAddBoundaryBox}
        handleRemoveBoundaryBox={handleRemoveBoundaryBox}
      />
      <User boundaryBoxes={boundaryBoxes} />
    </Canvas>
  )
}

export { World };
