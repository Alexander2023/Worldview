import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Euler, Matrix4, Quaternion, Raycaster, Vector2, Vector3 } from "three";
import { useEventListener } from 'usehooks-ts';

import { CLICKABLE_OBJECT_NAMES, MAX_CLICKABLE_DIST } from "./constants";
import { HandleChosenScreenPlacement } from "./types";

// Used to reduce a normalized vector to length of 0.1
const NORMALIZED_VECTOR_DIVIDER = 10;

const computePointer = (event: PointerEvent | MouseEvent) => {
  const pointer = new Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  return pointer;
};

/**
 * Custom hook for determining the cursor to use
 * when interacting with in-world objects
 *
 * @param isCameraMoving true if camera state is changing, false otherwise
 * @param isPlacingScreen true if placing screen, false otherwise
 * @param handleChosenScreenPlacement callback function for when the user
 *    chooses a spot to place the screen
 */
function usePointerEffect(isCameraMoving: boolean, isPlacingScreen: boolean,
    handleChosenScreenPlacement: HandleChosenScreenPlacement) {
  const canvasRef = useRef(document.getElementById('three-canvas'));

  const [initialPointer, setInitialPointer] = useState<Vector2 | null>(null);
  const [hasPointerMoved, setHasPointerMoved] = useState(false);
  const [raycaster] = useState(new Raycaster());
  const {camera, scene} = useThree();

  const getClickableIntersection = (pointer: Vector2) => {
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(scene.children);
    if (intersections.length === 0) {
      return null;
    }

    const intersection = intersections[0];
    const xzOrigin = new Vector2(camera.position.x, camera.position.z);
    const xzDestination = new Vector2(intersection.point.x,
        intersection.point.z);

    if (CLICKABLE_OBJECT_NAMES.includes(intersection.object.name) &&
        xzOrigin.distanceTo(xzDestination) <= MAX_CLICKABLE_DIST) {
      return intersection;
    }

    return null;
  };

  const updateCursorStyle = (pointer: Vector2) => {
    if (getClickableIntersection(pointer)) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
  };

  useFrame((state) => {
    if (hasPointerMoved) {
      updateCursorStyle(state.pointer);
    } else if (initialPointer && isCameraMoving) {
      updateCursorStyle(initialPointer);
    }
  });

  const handlePointerOver = (event: PointerEvent) => {
    setInitialPointer(computePointer(event));
  };

  const handlePointerMove = () => {
    if (!hasPointerMoved) {
      setHasPointerMoved(true);
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (!isPlacingScreen) {
      return;
    }

    event.stopPropagation();

    const intersection = getClickableIntersection(computePointer(event));
    if (!intersection || !intersection.face) {
      return;
    }

    const worldDirection = intersection.face.normal.clone().transformDirection(
        intersection.object.matrixWorld);
    const offset = worldDirection.normalize().divideScalar(
        NORMALIZED_VECTOR_DIVIDER);
    const offsetPosition = intersection.point.clone().add(offset);

    const rotationMatrix = new Matrix4().lookAt(worldDirection,
        new Vector3(0, 0, 0), new Vector3(0, 1, 0));
    const quaternion = new Quaternion().setFromRotationMatrix(rotationMatrix);
    const euler = new Euler().setFromQuaternion(quaternion.normalize(), 'YZX');

    handleChosenScreenPlacement(offsetPosition, euler.y);
  };

  useEventListener('pointerover', handlePointerOver, canvasRef);
  useEventListener('pointermove', handlePointerMove, canvasRef);
  useEventListener('click', handleClick, canvasRef, true);
};

export { usePointerEffect };
