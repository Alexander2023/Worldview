type HandleAddBoundaryBox = (object3D: THREE.Object3D) => void;

type HandleRemoveBoundaryBox = (key: number) => void;

type HandleChosenScreenPlacement = (position: THREE.Vector3,
    yRotation: number) => Promise<void>;

type HandleScreenConfig = (image: File) => void;

interface ScreenConfig {
  file: File;
  dimensions: number[];
}

interface StreamData {
  stream: MediaStream;
  /** Id of the server-side version of mediasoup carrier type */
  serverCarrierId: string;
  /** Type of mediasoup carrier of stream */
  mediasoupCarrierType: 'consumer' | 'producer';
}

interface UserMedia {
  audio?: StreamData;
  video?: StreamData;
}

export type { HandleAddBoundaryBox, HandleRemoveBoundaryBox, HandleChosenScreenPlacement, HandleScreenConfig, ScreenConfig, StreamData, UserMedia };