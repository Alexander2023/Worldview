import { Canvas } from '@react-three/fiber';

import './App.css';
import { Room } from './Room';
import { User } from './User';

function App() {
  return (
    <Canvas>
      <Room/>
      <User/>
    </Canvas>
  );
}

export { App };
