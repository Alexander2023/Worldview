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

interface Screen {
  dataUrl: string;
  dimensions: number[];
  position: number[];
  yRotation: number;
}

interface ServerToClientEvents {
  receiveRoom: (roomState: RoomState) => void;
  receiveScreen: (screen: Screen) => void;
  update: (avatars: [string, Avatar][]) => void;
}

interface ClientToServerEvents {
  joinRoom: () => void;
  sendScreen: (screen: Screen) => void;
  sendInput: (avatar: Avatar) => void;
}

export { Panel, RoomState, Avatar, Screen, ServerToClientEvents, ClientToServerEvents };
