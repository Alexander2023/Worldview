import { Socket } from 'socket.io';

import { Avatar, Screen, ClientToServerEvents, ServerToClientEvents, RoomState } from '../../shared/types';

/**
 * Wrapper handler for user-related event handlers
 *
 * @param sockets set of active sockets
 * @param avatars avatar entries of active sockets
 * @returns user-related event handlers
 */
const userHandler = (sockets: Set<Socket<ClientToServerEvents,
    ServerToClientEvents>>, avatars: Map<string, Avatar>) => {
  const handleJoinRoom = (socket: Socket<ClientToServerEvents,
      ServerToClientEvents>, roomState: RoomState) => {
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

  return {
    handleJoinRoom,
    handleSendScreen,
    handleSendInput
  }
};

export { userHandler };
