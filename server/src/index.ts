import http from 'http';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import { WebRtcTransport, Producer, Consumer } from "mediasoup/node/lib/types";

import { Avatar, ClientToServerEvents, ServerToClientEvents } from '../../shared/types';
import { routerConfig, socketServerConfig, webRtcServerConfig } from './data/config';
import { userHandler } from './handlers/userHandler';
import { mediasoupHandler } from './handlers/mediasoupHandler';
import { MediasoupIds, MediasoupState } from './types';
import roomState from './data/room-state.json';

const TICK_RATE = 60;

const initMediasoupState = async (): Promise<MediasoupState> => {
  const worker = await mediasoup.createWorker();
  const webRtcServer = await worker.createWebRtcServer(webRtcServerConfig);
  const router = await worker.createRouter(routerConfig);

  return {
    worker: worker,
    webRtcServer: webRtcServer,
    router: router,
    producerTransports: new Map<string, WebRtcTransport>(),
    consumerTransports: new Map<string, WebRtcTransport>(),
    consumers: new Map<string, Consumer>(),
    producers: new Map<string, Producer>()
  }
}

const main = async () => {
  try {
    const server = http.createServer();
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server,
        socketServerConfig);

    const sockets = new Set<Socket<ClientToServerEvents,
        ServerToClientEvents>>();
    // Stores mappings from socket id to avatar
    const avatars = new Map<string, Avatar>();

    const mediasoupState = await initMediasoupState();
    const socketIdToMediasoupIds = new Map<string, MediasoupIds>();

    const {handleJoinRoom, handleSendInput, handleSendScreen} =
        userHandler(sockets, avatars);

    const {handleGetTransportOptions, handleTransportConnect,
        handleTransportProduce, handleTransportConsume, handlePauseCarrier,
        handleResumeCarrier} =
            mediasoupHandler(sockets, mediasoupState, socketIdToMediasoupIds);

    io.on('connection', async socket => {
      console.log(`User Connected: ${socket.id}`);

      const producerTransport =
          await mediasoupState.router.createWebRtcTransport({
              webRtcServer: mediasoupState.webRtcServer});
      const consumerTransport =
          await mediasoupState.router.createWebRtcTransport({
              webRtcServer: mediasoupState.webRtcServer});

      mediasoupState.producerTransports.set(producerTransport.id,
          producerTransport);
      mediasoupState.consumerTransports.set(consumerTransport.id,
          consumerTransport);

      const mediasoupIds: MediasoupIds = {
        producerTransportId: producerTransport.id,
        consumerTransportId: consumerTransport.id,
        producerIds: [],
        consumerIds: []
      }

      socketIdToMediasoupIds.set(socket.id, mediasoupIds);

      socket.on('getRtpCapabilities', (callback) =>
          callback(mediasoupState.router.rtpCapabilities));
      socket.on('getTransportOptions', (...event) =>
          handleGetTransportOptions(mediasoupIds, ...event));
      socket.on('transportConnect', handleTransportConnect);
      socket.on('transportProduce', (...event) =>
          handleTransportProduce(socket.id, mediasoupIds, ...event));
      socket.on('transportConsume', (...event) =>
          handleTransportConsume(socket, mediasoupIds, ...event));
      socket.on('pauseCarrier', handlePauseCarrier);
      socket.on('resumeCarrier', handleResumeCarrier);

      socket.on('joinRoom', () => handleJoinRoom(socket, roomState));
      socket.on('sendScreen', (screen) => handleSendScreen(socket, screen));
      socket.on('sendInput', (avatar) => handleSendInput(socket, avatar));

      socket.on('disconnect', () => handleDisconnect(socket, mediasoupIds));

      setInterval(update, 1000 / TICK_RATE);
    });


    const handleDisconnect = (socket: Socket<ClientToServerEvents,
        ServerToClientEvents>, mediasoupIds: MediasoupIds) => {
      const {producerTransports, consumerTransports, producers, consumers} =
          mediasoupState;
      console.log(`User Disconnected: ${socket.id}`);

      sockets.delete(socket);
      avatars.delete(socket.id);

      if (producerTransports.has(mediasoupIds.producerTransportId)) {
        producerTransports.get(mediasoupIds.producerTransportId)!.close();
        producerTransports.delete(mediasoupIds.producerTransportId);
      }

      if (consumerTransports.has(mediasoupIds.consumerTransportId)) {
        consumerTransports.get(mediasoupIds.consumerTransportId)!.close();
        consumerTransports.delete(mediasoupIds.consumerTransportId);
      }

      for (const producerId of mediasoupIds.producerIds) {
        if (producers.has(producerId)) {
          producers.get(producerId)!.close();
          producers.delete(producerId);
        }
      }

      for (const consumerId of mediasoupIds.consumerIds) {
        if (consumers.has(consumerId)) {
          consumers.get(consumerId)!.close();
          consumers.delete(consumerId);
        }
      }

      socketIdToMediasoupIds.delete(socket.id);
    };

    const update = () => {
      sockets.forEach(socket => {
        const updatedAvatars = Array.from(avatars.entries()).filter(entry =>
            entry[0] !== socket.id);
        socket.volatile.emit('update', updatedAvatars);
      });
    };

    server.listen(3001, () => {
      console.log('SERVER RUNNING');
    });
  } catch (error) {
    console.log(error);
  }
};

main();
