import http from 'http';
import { Server, Socket } from 'socket.io';
import * as mediasoup from 'mediasoup';
import { Worker, WebRtcServer, Router, WebRtcTransport, DtlsParameters, MediaKind, RtpParameters, Producer } from "mediasoup/node/lib/types";

import roomState from './room-state.json';
import { Avatar, Screen, ClientToServerEvents, ServerToClientEvents, TransportOptions } from '../../shared/types';

const server = http.createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {origin: '*'},
  maxHttpBufferSize: 5e6 // 5 MB
});

const TICK_RATE = 60;
const sockets = new Set<Socket<ClientToServerEvents, ServerToClientEvents>>();
// Stores mappings from socket id to avatar
const avatars = new Map<string, Avatar>();

let worker: Worker;
let webRtcServer: WebRtcServer;
let router: Router;
// Stores mappings from a producer transport's id to itself
const producerTransports = new Map<string, WebRtcTransport>();
// Stores mappings from socket id to producer transport id
const clientProducerTransportId = new Map<string, string>();
// Stores mappings from socket id to producers
const clientProducers = new Map<string, Producer[]>();

const startMediasoup = async () => {
  try {
    worker = await mediasoup.createWorker();
    webRtcServer = await worker.createWebRtcServer({
      listenInfos: [
        {
          protocol: 'udp',
          ip: '::',
          announcedIp: '127.0.0.1',
          port: 3002
        }
      ]
    });
    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind       : 'video',
          mimeType   : 'video/VP9',
          clockRate  : 90000,
          parameters :
          {
            'profile-id'             : 2,
            'x-google-start-bitrate' : 1000
          }
        },
        {
          kind       : 'video',
          mimeType   : 'video/h264',
          clockRate  : 90000,
          parameters :
          {
            'packetization-mode'      : 1,
            'profile-level-id'        : '4d0032',
            'level-asymmetry-allowed' : 1,
            'x-google-start-bitrate'  : 1000
          }
        },
        {
          kind       : 'video',
          mimeType   : 'video/h264',
          clockRate  : 90000,
          parameters :
          {
            'packetization-mode'      : 1,
            'profile-level-id'        : '42e01f',
            'level-asymmetry-allowed' : 1,
            'x-google-start-bitrate'  : 1000
          }
        }
      ]
    });
  } catch (error) {
    console.log(error);
  }
};

startMediasoup();

io.on('connection', socket => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('getRtpCapabilities', (callback) =>
      callback(router.rtpCapabilities));
  socket.on('createTransport', (callback) =>
      handleCreateTransport(socket.id, callback));
  socket.on('transportConnect', handleTransportConnect);
  socket.on('transportProduce', (...event) =>
      handleTransportProduce(socket.id, ...event));

  socket.on('joinRoom', () => handleJoinRoom(socket));
  socket.on('sendScreen', (screen) => handleSendScreen(socket, screen));
  socket.on('sendInput', (avatar) => handleSendInput(socket, avatar));
  socket.on('disconnect', () => handleDisconnect(socket));

  setInterval(update, 1000 / TICK_RATE);
});

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

const handleJoinRoom = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>) => {
  sockets.add(socket);
  avatars.set(socket.id, {position: [0, 0, 0], yRotation: 0});
  socket.emit('receiveRoom', roomState);
};

const handleSendScreen = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>, screen: Screen) => {
  socket.broadcast.emit('receiveScreen', screen);
};

const handleSendInput = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>, avatar: Avatar) => {
  if (avatars.has(socket.id)) {
    avatars.set(socket.id, avatar);
  }
};

const handleDisconnect = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>) => {
  console.log(`User Disconnected: ${socket.id}`);

  sockets.delete(socket);
  avatars.delete(socket.id);
  clientProducers.delete(socket.id);

  const producerTransportId = clientProducerTransportId.get(socket.id);
  if (producerTransportId && producerTransports.has(producerTransportId)) {
    producerTransports.delete(producerTransportId);
  }

  clientProducerTransportId.delete(socket.id);
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
