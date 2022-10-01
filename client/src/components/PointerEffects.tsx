import { RootState, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BufferGeometry, Euler, Event, Intersection, Material, Matrix4, Mesh, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from "three";
import { useEventListener } from 'usehooks-ts';

import { CLICKABLE_OBJECT_NAMES, EFFECTS_OBJECT_NAMES, MAX_CLICKABLE_DIST } from "../data/constants";
import { HandleChosenScreenPlacement } from "../types";

// Used to reduce a normalized vector to length of 0.1
const NORMALIZED_VECTOR_DIVIDER = 10;
const PLACEMENT_TARGET_VECTOR = new Vector3(0, 0, 0);
const PLACEMENT_UP_VECTOR = new Vector3(0, 1, 0);

const computePointer = (event: PointerEvent | MouseEvent) => {
  const pointer = new Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  return pointer;
};

interface PointerEffectsProps {
  isCameraMoving: boolean;
  screenDimensions: number[] | null;
  handleChosenScreenPlacement: HandleChosenScreenPlacement;
}

/**
 * Generates the pointer effects to use when interacting with in-world objects
 */
function PointerEffects(props: PointerEffectsProps) {
  const {isCameraMoving, screenDimensions, handleChosenScreenPlacement} = props;

  const placementMarkerRef = useRef<Mesh<BufferGeometry,
      Material | Material[]>>(null);
  const canvasRef = useRef(document.getElementById('three-canvas'));
  const xzOriginRef = useRef(new Vector2());
  const xzDestinationRef = useRef(new Vector2());
  const normalVector = useRef(new Vector3());
  const raycasterRef = useRef(new Raycaster());
  const matrixRef = useRef(new Matrix4());
  const quaternionRef = useRef(new Quaternion());
  const eulerRef = useRef(new Euler());

  const [initialPointer, setInitialPointer] = useState<Vector2 | null>(null);
  const [hasPointerMoved, setHasPointerMoved] = useState(false);
  const {camera, scene} = useThree();

  const getValidPointer = (state: RootState) => {
    if (hasPointerMoved) {
      return state.pointer;
    } else if (initialPointer && isCameraMoving) {
      return initialPointer;
    }

    return null;
  };

  const getClickableIntersection = (pointer: Vector2) => {
    raycasterRef.current.setFromCamera(pointer, camera);
    const intersections = raycasterRef.current.intersectObjects(scene.children);
    if (intersections.length === 0) {
      return null;
    }

    let intersection = intersections[0];
    if (intersection.object.name === EFFECTS_OBJECT_NAMES.PLACEMENT_MARKER) {
      if (intersections.length < 2) {
        return null;
      }

      intersection = intersections[1];
    }

    const xzOrigin = xzOriginRef.current.set(camera.position.x,
        camera.position.z);
    const xzDestination = xzDestinationRef.current.set(intersection.point.x,
        intersection.point.z);

    if (CLICKABLE_OBJECT_NAMES.includes(intersection.object.name) &&
        xzOrigin.distanceTo(xzDestination) <= MAX_CLICKABLE_DIST) {
      return intersection;
    }

    return null;
  };

  const computeOffsetData = (intersection:
      Intersection<Object3D<Event>>) => {
    if (!intersection.face) {
      return null;
    }

    normalVector.current.copy(intersection.face.normal);

    const worldDirection = normalVector.current.transformDirection(
        intersection.object.matrixWorld);
    const offset = worldDirection.normalize().divideScalar(
        NORMALIZED_VECTOR_DIVIDER);
    const offsetPosition = intersection.point.add(offset);

    const rotationMatrix = matrixRef.current.lookAt(worldDirection,
        PLACEMENT_TARGET_VECTOR, PLACEMENT_UP_VECTOR);
    const quaternion = quaternionRef.current.setFromRotationMatrix(
        rotationMatrix);
    const euler = eulerRef.current.setFromQuaternion(quaternion.normalize(),
        'YZX');

    return { position: offsetPosition, yRotation: euler.y };
  };

  useFrame((state) => {
    const pointer = getValidPointer(state);
    if (!pointer) {
      return;
    }

    const intersection = getClickableIntersection(pointer);

    if (intersection) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }

    if (!screenDimensions || !placementMarkerRef.current) {
      return;
    }

    placementMarkerRef.current.visible = intersection !== null;

    if (!intersection) {
      return;
    }

    const offsetData = computeOffsetData(intersection);
    if (!offsetData) {
      return;
    }

    placementMarkerRef.current.position.copy(offsetData.position);
    placementMarkerRef.current.rotation.y = offsetData.yRotation;
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
    if (!screenDimensions) {
      return;
    }

    event.stopPropagation();

    const intersection = getClickableIntersection(computePointer(event));
    if (!intersection) {
      return;
    }

    const offsetData = computeOffsetData(intersection);
    if (!offsetData) {
      return;
    }

    handleChosenScreenPlacement(offsetData.position, offsetData.yRotation);
  };

  useEventListener('pointerover', handlePointerOver, canvasRef);
  useEventListener('pointermove', handlePointerMove, canvasRef);
  useEventListener('click', handleClick, canvasRef, true);

  if (!screenDimensions) {
    return null;
  }

  return (
    <mesh
      ref={placementMarkerRef}
      name={EFFECTS_OBJECT_NAMES.PLACEMENT_MARKER}
    >
      <planeBufferGeometry
        args={[screenDimensions[0], screenDimensions[1]]}
      />
      <meshBasicMaterial />
    </mesh>
  );
};

export { PointerEffects };
