import { DtlsParameters, MediaKind, RtpParameters, RtpCapabilities, Router, WebRtcServer, WebRtcTransport, Producer } from "mediasoup/node/lib/types";

import { TransportOptions } from '../../shared/types';
import { MediasoupState } from "./types";

/**
 * Wrapper handler for mediasoup-related event handlers
 *
 * @param mediasoupState state of the server-side mediasoup session
 * @returns mediasoup-related event handlers
 */
const mediasoupHandler = (mediasoupState: MediasoupState) => {
  const { router, webRtcServer, producerTransports, clientProducerTransportId,
      clientProducers } = mediasoupState;

  const handleCreateTransport = async (socketId: string,
      callback: (transportOptions: TransportOptions) => void) => {
    try {
      const producerTransport =
          await router.createWebRtcTransport({webRtcServer: webRtcServer});

      const producerTransportOptions = {
        id: producerTransport.id,
        iceParameters: producerTransport.iceParameters,
        iceCandidates: producerTransport.iceCandidates,
        dtlsParameters: producerTransport.dtlsParameters
      }

      callback(producerTransportOptions);

      producerTransports.set(producerTransport.id, producerTransport);
      clientProducerTransportId.set(socketId, producerTransport.id);
    } catch (error) {
      console.log(error);
    }
  };

  const handleTransportConnect = async (transportId: string,
      dtlsParameters: DtlsParameters, callback: () => void) => {
    const producerTransport = producerTransports.get(transportId);
    if (!producerTransport) {
      return;
    }

    try {
      await producerTransport.connect({dtlsParameters});
      callback();
    } catch (error) {
      console.log(error);
    }
  };

  const handleTransportProduce = async (socketId: string, transportId: string,
      kind: MediaKind, rtpParameters: RtpParameters,
      callback: (id: string) => void) => {
    const producerTransport = producerTransports.get(transportId);
    if (!producerTransport) {
      return;
    }

    try {
      const producer = await producerTransport.produce({
        kind: kind,
        rtpParameters: rtpParameters
      });

      callback(producer.id);

      if (!clientProducers.has(socketId)) {
        clientProducers.set(socketId, []);
      }

      clientProducers.get(socketId)!.push(producer);
    } catch (error) {
      console.log(error);
    }
  };

  return {
    handleCreateTransport,
    handleTransportConnect,
    handleTransportProduce
  }
};

export { mediasoupHandler };
