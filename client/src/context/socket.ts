import { createContext } from "react";
import { io, Socket } from "socket.io-client";

import { ClientToServerEvents, ServerToClientEvents } from "../../../shared/types";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    io('ws://localhost:3001');
const SocketContext = createContext(socket);

export { socket, SocketContext };