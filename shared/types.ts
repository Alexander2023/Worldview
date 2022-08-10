interface Panel {
  dimensions: number[];
  position: number[];
  yRotation: number;
}

interface RoomState {
  // relative to x-axis
  frameWidth: number;
  // relative to y-axis
  frameHeight: number;
  // relative to z-axis
  frameDepth: number;
  panels: Panel[];
}

interface ServerToClientEvents {
  createdRoom: (roomState: RoomState) => void;
}

interface ClientToServerEvents {
  createRoom: () => void;
}

export { Panel, RoomState, ServerToClientEvents, ClientToServerEvents };
