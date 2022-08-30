import { RootState, useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Raycaster, Vector2 } from "three";
import { CLICKABLE_OBJECT_NAMES, MAX_CLICKABLE_DIST } from "./constants";

// assumes pointer move events fire faster than delay
// to prevent premature pointer stop events
const MOUSE_MOVE_TIMER_DELAY = 300;

/**
 * Custom hook for determining the cursor to use
 * when interacting with in-world objects
 *
 * @param isCameraMoving true if camera state is changing, false otherwise
 */
function usePointerEffect(isCameraMoving: boolean) {
  const [isPointerMoving, setIsPointerMoving] = useState(false);
  const [pointer, setPointer] = useState<Vector2 | null>(null);
  const [raycaster] = useState(new Raycaster());

  useEffect(() => {
    let mouseMoveTimer: NodeJS.Timeout;

    const computePointer = (event: PointerEvent) => {
      const pointer = new Vector2();
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      return pointer;
    };

    const handlePointerOver = (event: PointerEvent) => {
      setPointer(computePointer(event));
    };

    const handlePointerMove = (event: PointerEvent) => {
      setPointer(computePointer(event));
      setIsPointerMoving(true);

      // prevents timer from going off until pointer stops moving
      clearTimeout(mouseMoveTimer);
      mouseMoveTimer = setTimeout(() => setIsPointerMoving(false),
          MOUSE_MOVE_TIMER_DELAY);
    };

    const threeCanvasElem = document.getElementById('three-canvas');

    if (threeCanvasElem) {
      threeCanvasElem.addEventListener('pointerover', handlePointerOver);
      threeCanvasElem.addEventListener('pointermove', handlePointerMove);
    } else {
      console.log('three canvas is null');
    }

    return () => {
      if (threeCanvasElem) {
        threeCanvasElem.removeEventListener('pointerover', handlePointerOver);
        threeCanvasElem.removeEventListener('pointermove', handlePointerMove);
      } else {
        console.log('three canvas is null');
      }
    };
  }, []);

  const shouldUseClickableStyle = (state: RootState) => {
    if (!pointer) {
      return false;
    }

    raycaster.setFromCamera(pointer, state.camera);
    const intersections = raycaster.intersectObjects(state.scene.children);

    if (intersections.length === 0) {
      return false;
    }

    const intersection = intersections[0];
    const xzOrigin = new Vector2(state.camera.position.x,
        state.camera.position.z);
    const xzDestination = new Vector2(intersection.point.x,
        intersection.point.z);

    return CLICKABLE_OBJECT_NAMES.includes(intersection.object.name) &&
        xzOrigin.distanceTo(xzDestination) <= MAX_CLICKABLE_DIST;
  };

  useFrame((state) => {
    if (isCameraMoving || isPointerMoving) {
      if (shouldUseClickableStyle(state)) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'auto';
      }
    }
  });
};

export { usePointerEffect };
