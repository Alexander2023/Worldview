import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from '@react-three/fiber';
import { useEffect, useState } from "react";

const MOVEMENT_SPEED = 20;
const ROTATIONAL_SPEED = Math.PI / 2;

/**
 * Generates a client-controlled first person perspective of the world
 */
function User() {
  const [moveFactor, setMoveFactor] = useState(0);
  const [rotateFactor, setRotateFactor] = useState(0);

  useEffect(() => {
    const keyDownListener = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setMoveFactor(-1);
      } else if (event.key === 'ArrowDown') {
        setMoveFactor(1);
      } else if (event.key === 'ArrowLeft') {
        setRotateFactor(1);
      } else if (event.key === 'ArrowRight') {
        setRotateFactor(-1);
      }
    }

    const keyUpListener = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        setMoveFactor(0);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        setRotateFactor(0);
      }
    }

    document.addEventListener('keydown', keyDownListener);
    document.addEventListener('keyup', keyUpListener);

    return () => {
      document.removeEventListener('keydown', keyDownListener);
      document.removeEventListener('keyup', keyUpListener);
    }
  }, []);

  useFrame((state, delta) => {
    // position
    state.camera.position.z += moveFactor * Math.cos(state.camera.rotation.y) *
        MOVEMENT_SPEED * delta;
    state.camera.position.x += moveFactor * Math.sin(state.camera.rotation.y) *
        MOVEMENT_SPEED * delta;

    // rotation
    state.camera.rotation.y += rotateFactor * ROTATIONAL_SPEED * delta;
  });

  return <PerspectiveCamera makeDefault position={[0, 5, 0]} />;
}

export { User };
