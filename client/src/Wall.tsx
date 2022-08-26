import { ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { BufferGeometry, Material, Mesh, Object3D, Texture } from "three";

import { HandleAddBoundaryBox, HandleRemoveBoundaryBox } from "./types";

interface WallProps {
  handleAddBoundaryBox: HandleAddBoundaryBox;
  handleRemoveBoundaryBox: HandleRemoveBoundaryBox;
  handleScreenPlacementClick: (event: ThreeEvent<MouseEvent>) => void;
  texture: Texture;
  position: number[];
  yRotation: number;
  scale: number[];
}

function Wall(props: WallProps) {
  const {handleAddBoundaryBox, handleRemoveBoundaryBox,
      handleScreenPlacementClick, texture, position, yRotation, scale} = props;

  const ref = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);

  useEffect(() => {
    const object3D = ref.current as Object3D;
    handleAddBoundaryBox(object3D);
    return () => handleRemoveBoundaryBox(object3D.id);
  }, [handleAddBoundaryBox, handleRemoveBoundaryBox]);

  return (
    <mesh
      ref={ref}
      position={[position[0], position[1], position[2]]}
      rotation-y={yRotation}
      onClick={handleScreenPlacementClick}
    >
      <planeBufferGeometry
        args={[scale[0], scale[1]]}
      />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

export { Wall };