import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "~/server/db";
import type { CAHSocketEvents } from "~/types/cah";

let httpServer: HTTPServer | null = null;
let io: SocketIOServer | null = null;

export const createSocketServer = (server: HTTPServer): SocketIOServer => {
  if (httpServer && io) {
    return io;
  }

  httpServer = server;
  io = new SocketIOServer<CAHSocketEvents>(server, {
    path: '/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  // Socket connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', async (roomId: string) => {
      try {
        await socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        // Update user's socket ID in database
        // This would need to be implemented based on your auth system
        // await db.user.update({
        //   where: { socketId: socket.id },
        //   data: { socketId: socket.id },
        // });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('game:error', 'Failed to join room');
      }
    });

    // Leave room
    socket.on('leave-room', async (roomId: string) => {
      await socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle game actions
    socket.on('game:action', async (action: { type: string; data: unknown; roomId: string }) => {
      try {
        const { type, data, roomId } = action;

        // Broadcast action to all clients in the room
        socket.to(roomId).emit('game:action', { type, data });

        // Handle specific actions
        switch (type) {
          case 'card-selected':
            socket.to(roomId).emit('game:card-selected', data);
            break;
          case 'card-deselected':
            socket.to(roomId).emit('game:card-deselected', data);
            break;
          case 'submission-ready':
            socket.to(roomId).emit('game:submission-ready', data);
            break;
          case 'vote-cast':
            socket.to(roomId).emit('game:vote-cast', data);
            break;
        }
      } catch (error) {
        console.error('Error handling game action:', error);
        socket.emit('game:error', 'Failed to process game action');
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer => {
  if (!httpServer || !io) {
    throw new Error('Socket server not initialized');
  }
  return io;
};

// Helper function to broadcast game state updates
export const broadcastGameState = async (roomId: string, gameState: unknown) => {
  const socketServer = getSocketServer();
  socketServer.to(roomId).emit('game:state-changed', gameState);
};

// Helper function to broadcast to specific room
export const broadcastToRoom = (roomId: string, event: string, data: unknown) => {
  const socketServer = getSocketServer();
  socketServer.to(roomId).emit(event, data);
};