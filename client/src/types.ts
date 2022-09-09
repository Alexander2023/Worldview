type HandleAddBoundaryBox = (object3D: THREE.Object3D) => void;

type HandleRemoveBoundaryBox = (key: number) => void;

type HandleChosenScreenPlacement = (position: THREE.Vector3,
    yRotation: number) => Promise<void>;

type HandleScreenConfig = (image: File) => void;

interface ScreenConfig {
  file: File;
  dimensions: number[];
}

export type { HandleAddBoundaryBox, HandleRemoveBoundaryBox, HandleChosenScreenPlacement, HandleScreenConfig, ScreenConfig };