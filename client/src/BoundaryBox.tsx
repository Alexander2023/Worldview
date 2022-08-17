import React from "react";
import { useEffect, useRef } from "react";
import { Box3, Object3D } from "three";
import { HandleAddBoundaryBox, HandleRemoveBoundaryBox } from "./types";

interface BoundaryBoxProps {
  handleAddBoundaryBox: HandleAddBoundaryBox;
  handleRemoveBoundaryBox: HandleRemoveBoundaryBox;
  children: JSX.Element;
}

/**
 * Generates a wrapper to manage a child's boundary box
 */
function BoundaryBox(props: BoundaryBoxProps) {
  const {handleAddBoundaryBox, handleRemoveBoundaryBox, children} = props;

  // ref should always be non-null since children mount before parent
  const ref = useRef<Object3D<Event>>(null!);

  useEffect(() => {
    const object3d = ref.current;

    const boundaryBox = new Box3();
    boundaryBox.setFromObject(object3d);
    handleAddBoundaryBox(object3d.id, boundaryBox);

    return () => handleRemoveBoundaryBox(object3d.id);
  }, [handleAddBoundaryBox, handleRemoveBoundaryBox]);

  return React.cloneElement(children, {ref: ref});
};

export { BoundaryBox };