import { useContext, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { Device, TransportEvents, TransportOptions, RtpCapabilities, Transport, Consumer, Producer } from "mediasoup-client/lib/types";

import { SocketContext } from "./context/socket";
import { withTimeout } from "./utils";
import { ConsumerOptions } from "../../shared/types";
import { StreamData, UserMedia } from "./types";

/**
 * Custom hook that provides access to media
 * streams of clients within the same room
 *
 * return an object containing:
 * - user media of the local client
 * - map with entries of socket id to user media for remote clients
 * - function for pausing locally produced and consumed media
 * - function for resuming locally produced and consumed media
 */
function useWebRTC() {
  const socket = useContext(SocketContext);

  const device = useRef<Device | null>(null);
  const consumerTransport = useRef<Transport | null>(null);
  const consumedProducerIds = useRef(new Set<string>());
  const clientProducers = useRef<Producer[]>([]);
  const serverConsumerIdToClientConsumer = useRef(new Map<string, Consumer>());

  const [producerTransport, setProducerTransport] =
      useState<Transport | null>(null);
  const [localUserMedia, setLocalUserMedia] = useState<UserMedia>({});
  const [socketIdToRemoteUserMedia, setSocketIdToRemoteUserMedia] =
      useState(new Map<string, UserMedia>());

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
        const localVideoStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });

        const localAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });

        const videoProducer = await producerTransport.produce({
          track: localVideoStream.getVideoTracks()[0]
        });

        const audioProducer = await producerTransport.produce({
          track: localAudioStream.getAudioTracks()[0]
        });

        clientProducers.current.push(videoProducer, audioProducer);

        setLocalUserMedia({
          video: {
            stream: localVideoStream,
            serverCarrierId: videoProducer.id,
            mediasoupCarrierType: 'producer'
          },
          audio: {
            stream: localAudioStream,
            serverCarrierId: audioProducer.id,
            mediasoupCarrierType: 'producer'
          }
        });
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

      const {id, producerId, producerSocketId, kind, rtpParameters} = options;

      try {
        const consumer = await consumerTransport.current.consume({
          id: id,
          producerId: producerId,
          kind: kind,
          rtpParameters: rtpParameters
        });

        serverConsumerIdToClientConsumer.current.set(id, consumer);

        const streamData: StreamData = {
          stream: new MediaStream([consumer.track]),
          serverCarrierId: id,
          mediasoupCarrierType: 'consumer'
        };

        setSocketIdToRemoteUserMedia(prevState => {
          const userMedia = prevState.get(producerSocketId);

          if (kind === 'audio') {
            prevState.set(producerSocketId, {...userMedia, audio: streamData});
          } else {
            prevState.set(producerSocketId, {...userMedia, video: streamData});
          }

          return new Map(prevState);
        });

        socket.emit('resumeCarrier', false, id);
      } catch (error) {
        console.log(error);
      }
    };

    const handleProducerClose = (consumerId: string, producerId: string,
        producerSocketId: string) => {
      consumedProducerIds.current.delete(producerId);

      if (serverConsumerIdToClientConsumer.current.has(consumerId)) {
        serverConsumerIdToClientConsumer.current.get(consumerId)!.close();
        serverConsumerIdToClientConsumer.current.delete(consumerId);
      }

      setSocketIdToRemoteUserMedia(prevState => {
        if (!prevState.has(producerSocketId)) {
          return prevState;
        }

        const userMedia = prevState.get(producerSocketId)!;

        if (userMedia.audio && userMedia.audio.serverCarrierId === consumerId) {
          delete userMedia.audio;
          prevState.set(producerSocketId, {...userMedia});
        } else if (userMedia.video &&
            userMedia.video.serverCarrierId === consumerId) {
          delete userMedia.video;
          prevState.set(producerSocketId, {...userMedia});
        }

        if (!userMedia.audio && !userMedia.video) {
          prevState.delete(producerSocketId);
        }

        return new Map(prevState);
      });
    };

    const handleProducerPause = (consumerId: string) => {
      const consumer = serverConsumerIdToClientConsumer.current.get(consumerId);
      if (!consumer) {
        return;
      }

      consumer.pause();
    };

    const handleProducerResume = (consumerId: string) => {
      const consumer = serverConsumerIdToClientConsumer.current.get(consumerId);
      if (!consumer) {
        return;
      }

      consumer.resume();
    };

    socket.on('updatedProducerIds', handleUpdatedProducerIds);
    socket.on('producerClose', handleProducerClose);
    socket.on('producerPause', handleProducerPause);
    socket.on('producerResume', handleProducerResume);

    return () => {
      socket.off('updatedProducerIds');
      socket.off('producerClose');
      socket.off('producerPause');
      socket.off('producerResume');
    }
  }, [socket]);

  const findMediasoupCarrier = (isProducer: boolean,
      serverCarrierId: string) => {
    if (isProducer) {
      return clientProducers.current.find(producer =>
          producer.id === serverCarrierId);
    } else {
      return serverConsumerIdToClientConsumer.current.get(serverCarrierId);
    }
  };

  const pauseMedia = (isProducer: boolean, serverCarrierId: string) => {
    const mediasoupCarrier = findMediasoupCarrier(isProducer, serverCarrierId);
    if (!mediasoupCarrier || mediasoupCarrier.paused) {
      return;
    }

    mediasoupCarrier.pause();
    socket.emit('pauseCarrier', isProducer, serverCarrierId);
  };

  const resumeMedia = (isProducer: boolean, serverCarrierId: string) => {
    const mediasoupCarrier = findMediasoupCarrier(isProducer, serverCarrierId);
    if (!mediasoupCarrier || !mediasoupCarrier.paused) {
      return;
    }

    mediasoupCarrier.resume();
    socket.emit('resumeCarrier', isProducer, serverCarrierId);
  };

  return {
    localUserMedia,
    socketIdToRemoteUserMedia,
    pauseMedia,
    resumeMedia
  };
}

export { useWebRTC };
