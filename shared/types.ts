import { RtpCapabilities, IceParameters, IceCandidate, DtlsParameters, MediaKind, RtpParameters } from "../server/node_modules/mediasoup/node/lib/types";

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

interface TransportOptions {
  id: string,
  iceParameters: IceParameters,
  iceCandidates: IceCandidate[],
  dtlsParameters: DtlsParameters
}

interface ServerToClientEvents {
  receiveRoom: (roomState: RoomState) => void;
  receiveScreen: (screen: Screen) => void;
  update: (avatars: [string, Avatar][]) => void;
}

interface ClientToServerEvents {
  getRtpCapabilities:
      (callback: (capabilities: RtpCapabilities) => void) => void;
  createTransport:
      (callback: (transportOptions: TransportOptions) => void) => void;
  transportConnect: (transportId: string, dtlsParameters: DtlsParameters,
      callback: () => void) => void;
  transportProduce: (transportId: string, kind: MediaKind,
      rtpParameters: RtpParameters, callback: (id: string) => void) => void;
  joinRoom: () => void;
  sendScreen: (screen: Screen) => void;
  sendInput: (avatar: Avatar) => void;
}

export { Panel, RoomState, Avatar, Screen, ServerToClientEvents, ClientToServerEvents, TransportOptions };
