import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";


// type HTTPServer = HTTPServer<typeof IncomingMessage, typeof ServerResponse>

let httpServer: HTTPServer | null = null;
let io: SocketIOServer | null = null;


export const createSocketServer = (server: HTTPServer): SocketIOServer => {

  if (httpServer && io) {
    return io;
  }

  httpServer = server;
  io = new SocketIOServer(server, {
    path: '/socket',
  });


  return io;
}

export const getSocketServer = (): SocketIOServer => {
  if (!httpServer || !io) {
    throw new Error('Socket server not initialized');
  }
  return io;
}