import http from 'http';
import { Server, Socket } from 'socket.io';
import roomState from './room-state.json';
import { Avatar, Screen, ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const server = http.createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {origin: '*'},
  maxHttpBufferSize: 5e6 // 5 MB
});

const TICK_RATE = 60;
const sockets = new Set<Socket<ClientToServerEvents, ServerToClientEvents>>();
const avatars = new Map<string, Avatar>();

io.on('connection', socket => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('joinRoom', () => onJoinRoom(socket));
  socket.on('sendScreen', (screen) => onSendScreen(socket, screen));
  socket.on('sendInput', (avatar) => onSendInput(socket, avatar));
  socket.on('disconnect', () => onDisconnect(socket));

  setInterval(update, 1000 / TICK_RATE);
});

const onJoinRoom = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>) => {
  sockets.add(socket);
  avatars.set(socket.id, {position: [0, 0, 0], yRotation: 0});
  socket.emit('receiveRoom', roomState);
};

const onSendScreen = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>, screen: Screen) => {
  socket.broadcast.emit('receiveScreen', screen);
}

const onSendInput = (socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    avatar: Avatar) => {
  if (avatars.has(socket.id)) {
    avatars.set(socket.id, avatar);
  }
};

const onDisconnect = (socket: Socket<ClientToServerEvents,
    ServerToClientEvents>) => {
  console.log(`User Disconnected: ${socket.id}`);

  sockets.delete(socket);
  avatars.delete(socket.id);
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
