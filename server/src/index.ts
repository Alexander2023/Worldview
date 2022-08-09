import http from 'http';
import { Server } from 'socket.io';
import roomState from './room-state.json';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const server = http.createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    server, {cors: {origin: '*'}});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  })

  socket.on('createRoom', () => {
    socket.emit('createdRoom', roomState);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
