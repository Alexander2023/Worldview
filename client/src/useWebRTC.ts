import { useContext, useEffect, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import { Device, TransportEvents, TransportOptions, RtpCapabilities } from "mediasoup-client/lib/types";

import { SocketContext } from "./context/socket";
import { withTimeout } from "./utils";

/**
 * Custom hook that provides access to media
 * streams of clients within the same room
 */
function useWebRTC() {
  const socket = useContext(SocketContext);

  const device = useRef<Device | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    const rtpCapabilitiesCallback = async (capabilities: RtpCapabilities) => {
      if (!device.current) {
        return;
      }

      try {
        await device.current.load({routerRtpCapabilities: capabilities});

        socket.emit('createTransport', (transportOptions) =>
            createTransportCallback(transportOptions as TransportOptions));
      } catch (error) {
        console.log(error);
      }
    };

    const createTransportCallback =
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
            handleConnect(producerTransport.id, event));
        producerTransport.on('produce', (...event) =>
            handleProduce(producerTransport.id, event));

        localStream.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        await producerTransport.produce({
          track: localStream.current.getVideoTracks()[0]
        });

        await producerTransport.produce({
          track: localStream.current.getAudioTracks()[0]
        });
      } catch (error) {
        console.log(error);
      }
    };

    const handleConnect = async (transportId: string,
        event: TransportEvents['connect']) => {
      const [{dtlsParameters}, callback, errback] = event;

      const onSuccess = () => callback();
      const onTimeout = () =>
          errback(new Error('Failed to transmit connect parameters to server'));

      socket.emit('transportConnect', transportId, dtlsParameters,
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
      console.log(error)
    }
  }, [socket]);

  return localStream;
}

export { useWebRTC };
