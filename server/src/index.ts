import http from 'http';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import { WebRtcTransport, Producer } from "mediasoup/node/lib/types";

import { Avatar, ClientToServerEvents, ServerToClientEvents } from '../../shared/types';
import { routerConfig, socketServerConfig, webRtcServerConfig } from './config';
import { userHandler } from './userHandler';
import { mediasoupHandler } from './mediasoupHandler';
import { MediasoupState } from './types';
import roomState from './room-state.json';

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
    clientProducerTransportId: new Map<string, string>(),
    clientProducers: new Map<string, Producer[]>()
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

    const { handleJoinRoom, handleSendInput, handleSendScreen } =
        userHandler(sockets, avatars);

    const { handleCreateTransport, handleTransportConnect,
        handleTransportProduce } = mediasoupHandler(mediasoupState);

    io.on('connection', socket => {
      console.log(`User Connected: ${socket.id}`);

      socket.on('getRtpCapabilities', (callback) =>
          callback(mediasoupState.router.rtpCapabilities));
      socket.on('createTransport', (callback) =>
          handleCreateTransport(socket.id, callback));
      socket.on('transportConnect', handleTransportConnect);
      socket.on('transportProduce', (...event) =>
          handleTransportProduce(socket.id, ...event));

      socket.on('joinRoom', () => handleJoinRoom(socket, roomState));
      socket.on('sendScreen', (screen) => handleSendScreen(socket, screen));
      socket.on('sendInput', (avatar) => handleSendInput(socket, avatar));

      socket.on('disconnect', () => handleDisconnect(socket));

      setInterval(update, 1000 / TICK_RATE);
    });


    const handleDisconnect = (socket: Socket<ClientToServerEvents,
        ServerToClientEvents>) => {
      console.log(`User Disconnected: ${socket.id}`);

      sockets.delete(socket);
      avatars.delete(socket.id);
      mediasoupState.clientProducers.delete(socket.id);

      const producerTransportId =
          mediasoupState.clientProducerTransportId.get(socket.id);
      if (producerTransportId &&
          mediasoupState.producerTransports.has(producerTransportId)) {
        mediasoupState.producerTransports.delete(producerTransportId);
      }

      mediasoupState.clientProducerTransportId.delete(socket.id);
    };

    const update = () => {
      sockets.forEach(socket => {
        socket.emit('update', Array.from(avatars.entries()).filter(entry =>
            entry[0] !== socket.id));
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
