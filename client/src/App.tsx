import { Canvas } from '@react-three/fiber';
import { useCallback, useState } from 'react';

import './App.css';
import { socket, SocketContext } from './context/socket';
import { Room } from './Room';
import { User } from './User';

function App() {
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
      <SocketContext.Provider value={socket} >
        <Room
          handleAddBoundaryBox={handleAddBoundaryBox}
          handleRemoveBoundaryBox={handleRemoveBoundaryBox}
        />
        <User boundaryBoxes={boundaryBoxes} />
      </SocketContext.Provider>
    </Canvas>
  );
}

export { App };
