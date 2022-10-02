import { PerspectiveCamera } from "@react-three/drei";
import { RootState, useFrame } from '@react-three/fiber';
import { useContext, useEffect, useState } from "react";
import { Box3, Vector3 } from "three";

import { CUBE_SIZE } from "./Avatar";
import { SocketContext } from "../context/socket";
import { HandleChosenScreenPlacement } from "../types";
import { PointerEffects } from "./PointerEffects";

const MOVEMENT_SPEED = 20;
const ROTATIONAL_SPEED = Math.PI / 2;
const DEFAULT_HEIGHT = 5;
const CUBE_DIAGONAL = Math.sqrt(2) * CUBE_SIZE;

interface UserProps {
  boundaryBoxes: Map<number, THREE.Box3>;
  screenDimensions: number[] | null;
  handleChosenScreenPlacement: HandleChosenScreenPlacement;
}

/**
 * Generates a client-controlled first person perspective of the world
 */
function User(props: UserProps) {
  const {boundaryBoxes, screenDimensions, handleChosenScreenPlacement} = props;

  const socket = useContext(SocketContext);

  const [moveFactor, setMoveFactor] = useState(0);
  const [rotateFactor, setRotateFactor] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setMoveFactor(-1);
      } else if (event.key === 'ArrowDown') {
        setMoveFactor(1);
      } else if (event.key === 'ArrowLeft') {
        setRotateFactor(1);
      } else if (event.key === 'ArrowRight') {
        setRotateFactor(-1);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        setMoveFactor(0);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        setRotateFactor(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isCollision = (state: RootState, xMovement: number,
      zMovement: number) => {
    const simulation = state.camera.position.clone();
    simulation.x += xMovement;
    simulation.z += zMovement;
    simulation.y -= DEFAULT_HEIGHT / 2;

    const userBoundaryBox = new Box3();
    userBoundaryBox.setFromCenterAndSize(simulation, new Vector3(CUBE_DIAGONAL,
        DEFAULT_HEIGHT, CUBE_DIAGONAL));

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

    socket.volatile.emit('sendInput', {
      position: state.camera.position.toArray(),
      yRotation: state.camera.rotation.y
    });
  });

  return (
    <>
      <PerspectiveCamera makeDefault position-y={DEFAULT_HEIGHT} />
      <PointerEffects
        isCameraMoving={moveFactor !== 0 || rotateFactor !== 0}
        screenDimensions={screenDimensions}
        handleChosenScreenPlacement={handleChosenScreenPlacement}
      />
    </>
  );
}

export { User };
