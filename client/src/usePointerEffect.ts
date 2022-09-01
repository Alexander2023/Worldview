import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Raycaster, Vector2 } from "three";
import { useEventListener } from 'usehooks-ts'

import { CLICKABLE_OBJECT_NAMES, MAX_CLICKABLE_DIST } from "./constants";

const computePointer = (event: PointerEvent) => {
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
 */
function usePointerEffect(isCameraMoving: boolean) {
  const canvasRef = useRef(document.getElementById('three-canvas'));
  const [pointer, setPointer] = useState<Vector2 | null>(null);
  const [raycaster] = useState(new Raycaster());
  const {camera, scene} = useThree();

  const shouldUseClickableStyle = () => {
    if (!pointer) {
      return false;
    }

    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(scene.children);

    if (intersections.length === 0) {
      return false;
    }

    const intersection = intersections[0];
    const xzOrigin = new Vector2(camera.position.x, camera.position.z);
    const xzDestination = new Vector2(intersection.point.x,
        intersection.point.z);

    return CLICKABLE_OBJECT_NAMES.includes(intersection.object.name) &&
        xzOrigin.distanceTo(xzDestination) <= MAX_CLICKABLE_DIST;
  };

  const updateCursorStyle = () => {
    if (shouldUseClickableStyle()) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
  };

  useFrame(() => {
    if (isCameraMoving) {
      updateCursorStyle();
    }
  });

  const handlePointerOver = (event: PointerEvent) => {
    setPointer(computePointer(event));
  };

  const handlePointerMove = (event: PointerEvent) => {
    setPointer(computePointer(event));
    updateCursorStyle();
  };

  useEventListener('pointerover', handlePointerOver, canvasRef);
  useEventListener('pointermove', handlePointerMove, canvasRef);
};

export { usePointerEffect };
