import { Worker, WebRtcServer, Router, WebRtcTransport, Producer } from "mediasoup/node/lib/types";

interface MediasoupState {
  worker: Worker;
  webRtcServer: WebRtcServer;
  router: Router;
  /** Stores mappings from a producer transport's id to itself */
  producerTransports: Map<string, WebRtcTransport>;
  /** Stores mappings from socket id to producer transport id */
  clientProducerTransportId: Map<string, string>;
  /** Stores mappings from socket id to producers */
  clientProducers: Map<string, Producer[]>;
}

export { MediasoupState };