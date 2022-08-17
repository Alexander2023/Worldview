import { PerspectiveCamera } from "@react-three/drei";
import { RootState, useFrame } from '@react-three/fiber';
import { useEffect, useState } from "react";
import * as THREE from 'three';

const MOVEMENT_SPEED = 20;
const ROTATIONAL_SPEED = Math.PI / 2;
const DEFAULT_HEIGHT = 5;
const BOUNDARY_BOX_DIMENSIONS = [2, DEFAULT_HEIGHT, 2];

interface UserProps {
  boundaryBoxes: Map<number, THREE.Box3>;
}

/**
 * Generates a client-controlled first person perspective of the world
 */
function User({boundaryBoxes}: UserProps) {
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

  const isCollision = (state: RootState, xMovement: number,
      zMovement: number) => {
    const simulation = state.camera.position.clone();
    simulation.x += xMovement;
    simulation.z += zMovement;
    simulation.y -= DEFAULT_HEIGHT / 2;

    const userBoundaryBox = new THREE.Box3();
    userBoundaryBox.setFromCenterAndSize(simulation, new THREE.Vector3(
        ...BOUNDARY_BOX_DIMENSIONS));

    for (const boundaryBox of boundaryBoxes.values()) {
      if (userBoundaryBox.intersectsBox(boundaryBox)) {
        return true;
      }
    }

    return false;
  };

  useFrame((state, delta) => {
    const xMovement = moveFactor * Math.sin(state.camera.rotation.y) *
        MOVEMENT_SPEED * delta;
    const zMovement = moveFactor * Math.cos(state.camera.rotation.y) *
        MOVEMENT_SPEED * delta;
    const yRotation = rotateFactor * ROTATIONAL_SPEED * delta;

    state.camera.rotation.y += yRotation;

    if (!isCollision(state, xMovement, zMovement)) {
      state.camera.position.x += xMovement;
      state.camera.position.z += zMovement;
    }
  });

  return <PerspectiveCamera makeDefault position-y={DEFAULT_HEIGHT} />;
}

export { User };
