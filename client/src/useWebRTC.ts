import { useContext, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { Device, TransportEvents, TransportOptions, RtpCapabilities, Transport, Consumer } from "mediasoup-client/lib/types";

import { SocketContext } from "./context/socket";
import { withTimeout } from "./utils";
import { ConsumerOptions } from "../../shared/types";

/**
 * Custom hook that provides access to media
 * streams of clients within the same room
 */
function useWebRTC() {
  const socket = useContext(SocketContext);

  const device = useRef<Device | null>(null);
  const consumerTransport = useRef<Transport | null>(null);
  const consumedProducerIds = useRef(new Set<string>());
  // Stores mappings from producerId to consumer
  const consumers = useRef(new Map<string, Consumer>());

  const [producerTransport, setProducerTransport] =
      useState<Transport | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // Stores mappings from producerId to media stream
  const [remoteStreams, setRemoteStreams] =
      useState(new Map<string, MediaStream>());

  useEffect(() => {
    const rtpCapabilitiesCallback = async (capabilities: RtpCapabilities) => {
      if (!device.current) {
        return;
      }

      try {
        await device.current.load({routerRtpCapabilities: capabilities});

        socket.emit('getTransportOptions', true, (transportOptions) =>
            getProducerTransportOptionsCallback(
                transportOptions as TransportOptions));
        socket.emit('getTransportOptions', false, (transportOptions) =>
            getConsumerTransportOptionsCallback(
              transportOptions as TransportOptions));
      } catch (error) {
        console.log(error);
      }
    };

    const getProducerTransportOptionsCallback =
        async (transportOptions: TransportOptions) => {
      if (!device.current) {
        return;
      }

      try {
        if (!device.current.canProduce('video') ||
            !device.current.canProduce('audio')) {
          return;
        }

        const producerTransport =
            device.current.createSendTransport(transportOptions);
        producerTransport.on('connect', (...event) =>
            handleConnect(true, producerTransport.id, event));
        producerTransport.on('produce', (...event) =>
            handleProduce(producerTransport.id, event));

        setProducerTransport(producerTransport);
      } catch (error) {
        console.log(error);
      }
    };

    const getConsumerTransportOptionsCallback =
        async (transportOptions: TransportOptions) => {
      if (!device.current) {
        return;
      }

      try {
        consumerTransport.current =
            device.current.createRecvTransport(transportOptions);
        consumerTransport.current.on('connect', (...event) =>
            handleConnect(false, consumerTransport.current!.id, event));
      } catch (error) {
        console.log(error);
      }
    };

    const handleConnect = async (isProducer: boolean, transportId: string,
        event: TransportEvents['connect']) => {
      const [{dtlsParameters}, callback, errback] = event;

      const onSuccess = () => callback();
      const onTimeout = () =>
          errback(new Error('Failed to transmit connect parameters to server'));

      socket.emit('transportConnect', isProducer, transportId, dtlsParameters,
          withTimeout(onSuccess, onTimeout));
    };

    const handleProduce = (transportId: string,
        event: TransportEvents['produce']) => {
      const [{kind, rtpParameters}, callback, errback] = event;

      const onSuccess = (id: string) => callback({id});
      const onTimeout = () =>
          errback(new Error('Failed to transmit produce parameters to server'));

      socket.emit('transportProduce', transportId, kind, rtpParameters,
          withTimeout(onSuccess, onTimeout));
    };

    try {
      device.current = new mediasoupClient.Device();
      socket.emit('getRtpCapabilities', rtpCapabilitiesCallback);
    } catch (error) {
      console.log(error);
    }
  }, [socket]);

  useEffect(() => {
    const produceMedia = async () => {
      if (!producerTransport) {
        return;
      }

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        await producerTransport.produce({
          track: localStream.getVideoTracks()[0]
        });

        await producerTransport.produce({
          track: localStream.getAudioTracks()[0]
        });

        setLocalStream(localStream);
      } catch (error) {
        console.log(error);
      }
    };

    produceMedia();
  }, [producerTransport]);

  useEffect(() => {
    const handleUpdatedProducerIds = (updatedProducerIds: string[]) => {
      if (!device.current) {
        return;
      }

      for (const producerId of updatedProducerIds) {
        if (!consumedProducerIds.current.has(producerId)) {
          consumedProducerIds.current.add(producerId);
          socket.emit('transportConsume', producerId,
              device.current.rtpCapabilities, transportConsumeCallback);
        }
      }
    };

    const transportConsumeCallback = async (options: ConsumerOptions) => {
      if (!consumerTransport.current) {
        return;
      }

      try {
        const consumer = await consumerTransport.current.consume({
          id: options.id,
          producerId: options.producerId,
          kind: options.kind,
          rtpParameters: options.rtpParameters
        });

        consumers.current.set(options.producerId, consumer);

        socket.emit('resumeConsumer', options.id);

        setRemoteStreams(prevRemoteStreams => {
          return new Map([...prevRemoteStreams,
              [options.producerId, new MediaStream([consumer.track])]]);
        });
      } catch (error) {
        console.log(error);
      }
    };

    const handleProducerClose = (producerId: string) => {
      consumedProducerIds.current.delete(producerId);

      if (consumers.current.has(producerId)) {
        consumers.current.get(producerId)!.close();
        consumers.current.delete(producerId);
      }

      setRemoteStreams(prevRemoteStreams => {
        const newRemoteStreams = new Map(prevRemoteStreams);
        newRemoteStreams.delete(producerId);
        return newRemoteStreams;
      });
    };

    socket.on('updatedProducerIds', handleUpdatedProducerIds);
    socket.on('producerClose', handleProducerClose);

    return () => {
      socket.off('updatedProducerIds');
      socket.off('producerClose');
    }
  }, [socket]);

  return [localStream, Array.from(remoteStreams.values())];
}

export { useWebRTC };
