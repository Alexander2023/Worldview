import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import './App.css';
import { Room } from './Room';

function App() {
  return (
    <Canvas>
      <OrbitControls object-position={[0, 50, 100]} />
      <Room/>
    </Canvas>
  );
}

export { App };
