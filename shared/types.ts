export interface Panel {
  dimensions: number[];
  position: number[];
  yRotation: number;
}

export interface RoomState {
  // relative to x-axis
  frameWidth: number;
  // relative to y-axis
  frameHeight: number;
  // relative to z-axis
  frameDepth: number;
  panels: Panel[];
}

export interface ServerToClientEvents {
  createdRoom: (roomState: RoomState) => void;
}

export interface ClientToServerEvents {
  createRoom: () => void;
}