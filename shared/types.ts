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

interface ConsumerOptions {
  id: string;
  producerId: string;
  producerSocketId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}

interface ServerToClientEvents {
  updatedProducerIds: (producerIds: string[]) => void;
  producerClose: (producerId: string, producerSocketId: string) => void;
  receiveRoom: (roomState: RoomState) => void;
  receiveScreen: (screen: Screen) => void;
  update: (avatars: [string, Avatar][]) => void;
}

interface ClientToServerEvents {
  getRtpCapabilities:
      (callback: (capabilities: RtpCapabilities) => void) => void;
  getTransportOptions: (isProducer: boolean,
      callback: (transportOptions: TransportOptions) => void) => void;
  transportConnect: (isProducer: boolean, transportId: string,
      dtlsParameters: DtlsParameters, callback: () => void) => void;
  transportProduce: (transportId: string, kind: MediaKind,
      rtpParameters: RtpParameters, callback: (id: string) => void) => void;
  transportConsume: (producerId: string, rtpCapabilities: RtpCapabilities,
      callback: (consumerOptions: ConsumerOptions) => void) => void;
  resumeConsumer: (consumerId: string) => void;
  joinRoom: () => void;
  sendScreen: (screen: Screen) => void;
  sendInput: (avatar: Avatar) => void;
}

export { Panel, RoomState, Avatar, Screen, ServerToClientEvents, ClientToServerEvents, TransportOptions, ConsumerOptions };
