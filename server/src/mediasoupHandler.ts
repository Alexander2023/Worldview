import { DtlsParameters, MediaKind, RtpParameters, RtpCapabilities, WebRtcTransport } from "mediasoup/node/lib/types";
import { Socket } from "socket.io";

import { ClientToServerEvents, ConsumerOptions, ServerToClientEvents, TransportOptions } from '../../shared/types';
import { MediasoupIds, MediasoupState } from "./types";

/**
 * Wrapper handler for mediasoup-related event handlers
 *
 * @param sockets set of active sockets
 * @param mediasoupState state of the server-side mediasoup session
 * @param socketIdToMediasoupIds mediasoupState ids of active sockets
 * @returns mediasoup-related event handlers
 */
const mediasoupHandler = (sockets: Set<Socket<ClientToServerEvents,
    ServerToClientEvents>>, mediasoupState: MediasoupState,
    socketIdToMediasoupIds: Map<string, MediasoupIds>) => {
  const {router, producerTransports, consumerTransports, producers,
      consumers} = mediasoupState;

  const handleGetTransportOptions = async (mediasoupIds: MediasoupIds,
      isProducer: boolean, callback: (transportOptions: TransportOptions)
          => void) => {
    let transport: WebRtcTransport | undefined;

    if (isProducer) {
      transport = producerTransports.get(mediasoupIds.producerTransportId);
    } else {
      transport = consumerTransports.get(mediasoupIds.consumerTransportId);
    }

    if (!transport) {
      return;
    }

    const transportOptions = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters
    }

    callback(transportOptions);
  };

  const handleTransportConnect = async (isProducer: boolean,
      transportId: string, dtlsParameters: DtlsParameters,
      callback: () => void) => {
    let transport: WebRtcTransport | undefined;

    if (isProducer) {
      transport = producerTransports.get(transportId);
    } else {
      transport = consumerTransports.get(transportId);
    }

    if (!transport) {
      return;
    }

    try {
      await transport.connect({dtlsParameters});
      callback();
    } catch (error) {
      console.log(error);
    }
  };

  const handleTransportProduce = async (mediasoupIds: MediasoupIds,
      transportId: string, kind: MediaKind, rtpParameters: RtpParameters,
      callback: (id: string) => void) => {
    if (!producerTransports.has(transportId)) {
      return;
    }

    try {
      const producer = await producerTransports.get(transportId)!.produce({
        kind: kind,
        rtpParameters: rtpParameters
      });

      producers.set(producer.id, producer);
      mediasoupIds.producerIds.push(producer.id);

      callback(producer.id);
      alertConsumers();
    } catch (error) {
      console.log(error);
    }
  };

  const alertConsumers = () => {
    for (const socket of sockets) {
      if (!socketIdToMediasoupIds.has(socket.id)) {
        continue;
      }

      const mediasoupIds = socketIdToMediasoupIds.get(socket.id)!;
      const producerIds: string[] = [];

      for (const producerId of producers.keys()) {
        if (!mediasoupIds.producerIds.includes(producerId)) {
          producerIds.push(producerId);
        }
      }

      socket.emit('updatedProducerIds', producerIds);
    }
  };

  const handleTransportConsume = async (socket: Socket<ClientToServerEvents,
      ServerToClientEvents>, mediasoupIds: MediasoupIds, producerId: string,
      rtpCapabilities: RtpCapabilities,
      callback: (consumerOptions: ConsumerOptions) => void) => {
    if (!consumerTransports.has(mediasoupIds.consumerTransportId) ||
        !router.canConsume({producerId, rtpCapabilities})) {
      return;
    }

    const consumerTransport =
        consumerTransports.get(mediasoupIds.consumerTransportId)!;

    try {
      const consumer = await consumerTransport.consume({
        producerId: producerId,
        rtpCapabilities: rtpCapabilities,
        paused: true
      });

      consumer.on('producerclose', () =>
          handleProducerClose(socket, mediasoupIds, producerId, consumer.id));

      consumers.set(consumer.id, consumer);
      mediasoupIds.consumerIds.push(consumer.id);

      const consumerOptions = {
        id: consumer.id,
        producerId: producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      }

      callback(consumerOptions);
    } catch (error) {
      console.log(error);
    }
  }

  const handleProducerClose = (socket: Socket<ClientToServerEvents,
      ServerToClientEvents>, mediasoupIds: MediasoupIds, producerId: string,
      consumerId: string) => {
    socket.emit('producerClose', producerId);

    consumers.delete(consumerId);

    const idx = mediasoupIds.consumerIds.indexOf(consumerId);
    if (idx > -1) {
      mediasoupIds.consumerIds.splice(idx, 1);
    }
  };

  const handleResumeConsumer = async (consumerId: string) => {
    if (!consumers.has(consumerId)) {
      return;
    }

    try {
      await consumers.get(consumerId)!.resume();
    } catch (error) {
      console.log(error);
    }
  };

  return {
    handleGetTransportOptions,
    handleTransportConnect,
    handleTransportProduce,
    handleTransportConsume,
    handleResumeConsumer
  }
};

export { mediasoupHandler };
