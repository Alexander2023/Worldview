import { Worker, WebRtcServer, Router, WebRtcTransport, Producer, Consumer } from "mediasoup/node/lib/types";

interface MediasoupState {
  worker: Worker;
  webRtcServer: WebRtcServer;
  router: Router;
  /** Stores mappings from a producer transport's id to itself */
  producerTransports: Map<string, WebRtcTransport>;
  /** Stores mappings from a consumer transport's id to itself */
  consumerTransports: Map<string, WebRtcTransport>;
  /** Stores mappings from a consumer's id to itself */
  consumers: Map<string, Consumer>;
  /** Stores mappings from a producer's id to itself */
  producers: Map<string, Producer>;
}

interface MediasoupIds {
  producerTransportId: string;
  consumerTransportId: string;
  producerIds: string[];
  consumerIds: string[];
}

export { MediasoupState, MediasoupIds };
