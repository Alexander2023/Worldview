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

interface Avatar {
  position: number[];
  yRotation: number;
}

interface ServerToClientEvents {
  receiveRoom: (roomState: RoomState) => void;
  update: (avatars: [string, Avatar][]) => void;
}

interface ClientToServerEvents {
  joinRoom: () => void;
  sendInput: (avatar: Avatar) => void;
}

export { Panel, RoomState, Avatar, ServerToClientEvents, ClientToServerEvents };
