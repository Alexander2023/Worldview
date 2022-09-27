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

  const handleTransportProduce = async (socketId: string,
      mediasoupIds: MediasoupIds, transportId: string, kind: MediaKind,
      rtpParameters: RtpParameters, callback: (id: string) => void) => {
    if (!producerTransports.has(transportId)) {
      return;
    }

    try {
      const producer = await producerTransports.get(transportId)!.produce({
        kind: kind,
        rtpParameters: rtpParameters,
        appData: {socketId: socketId}
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
    const producer = producers.get(producerId);

    if (!producer?.appData.socketId ||
        typeof producer.appData.socketId !== 'string' ||
        !consumerTransports.has(mediasoupIds.consumerTransportId) ||
        !router.canConsume({producerId, rtpCapabilities})) {
      return;
    }

    const producerSocketId = producer.appData.socketId as string;

    const consumerTransport =
        consumerTransports.get(mediasoupIds.consumerTransportId)!;

    try {
      const consumer = await consumerTransport.consume({
        producerId: producerId,
        rtpCapabilities: rtpCapabilities,
        paused: true
      });

      consumer.on('producerclose', () => handleProducerClose(socket,
          mediasoupIds, producerId, producerSocketId, consumer.id));
      consumer.on('producerpause', () =>
          socket.emit('producerPause', consumer.id));
      consumer.on('producerresume', () =>
          socket.emit('producerResume', consumer.id));

      consumers.set(consumer.id, consumer);
      mediasoupIds.consumerIds.push(consumer.id);

      const consumerOptions = {
        id: consumer.id,
        producerId: producerId,
        producerSocketId: producerSocketId,
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
      producerSocketId: string, consumerId: string) => {
    socket.emit('producerClose', consumerId, producerId, producerSocketId);

    consumers.delete(consumerId);

    const idx = mediasoupIds.consumerIds.indexOf(consumerId);
    if (idx > -1) {
      mediasoupIds.consumerIds.splice(idx, 1);
    }
  };

  const findCarrier = (isProducer: boolean, serverCarrierId: string) => {
    if (isProducer) {
      return producers.get(serverCarrierId);
    } else {
      return consumers.get(serverCarrierId);
    }
  };

  const handlePauseCarrier = async (isProducer: boolean,
      serverCarrierId: string) => {
    const carrier = findCarrier(isProducer, serverCarrierId);
    if (!carrier) {
      return;
    }

    try {
      await carrier.pause();
    } catch (error) {
      console.log(error);
    }
  };

  const handleResumeCarrier = async (isProducer: boolean,
      serverCarrierId: string) => {
    const carrier = findCarrier(isProducer, serverCarrierId);
    if (!carrier) {
      return;
    }

    try {
      await carrier.resume();
    } catch (error) {
      console.log(error);
    }
  };

  return {
    handleGetTransportOptions,
    handleTransportConnect,
    handleTransportProduce,
    handleTransportConsume,
    handlePauseCarrier,
    handleResumeCarrier
  }
};

export { mediasoupHandler };
