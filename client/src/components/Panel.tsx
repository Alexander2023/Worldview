import { ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { BufferGeometry, Material, Mesh, Object3D } from "three";

import { Panel as PanelType } from "../../../shared/types";
import { EFFECTS_OBJECT_NAMES } from "../data/constants";
import { HandleAddBoundaryBox, HandleRemoveBoundaryBox } from "../types";

interface PanelProps {
  handleAddBoundaryBox: HandleAddBoundaryBox;
  handleRemoveBoundaryBox: HandleRemoveBoundaryBox;
  panelData: PanelType;
  handleScreenPlacementClick: (event: ThreeEvent<MouseEvent>) => void;
}

function Panel(props: PanelProps) {
  const {handleAddBoundaryBox, handleRemoveBoundaryBox, panelData,
        handleScreenPlacementClick} = props;

  const ref = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);

  useEffect(() => {
    const object3D = ref.current as Object3D;
    handleAddBoundaryBox(object3D);
    return () => handleRemoveBoundaryBox(object3D.id);
  }, [handleAddBoundaryBox, handleRemoveBoundaryBox]);

  return (
    <mesh
      ref={ref}
      name={EFFECTS_OBJECT_NAMES.PANEL}
      position={[panelData.position[0], panelData.position[1],
          panelData.position[2]]}
      rotation-y={panelData.yRotation * (Math.PI / 180)}
      onClick={handleScreenPlacementClick}
    >
      <boxBufferGeometry
        args={[panelData.dimensions[0], panelData.dimensions[1],
            panelData.dimensions[2]]}
      />
      <meshStandardMaterial />
    </mesh>
  )
}

export { Panel };
