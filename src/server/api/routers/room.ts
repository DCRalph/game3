import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

import { GameType } from "@prisma/client";

export const roomRouter = createTRPCRouter({

  // Create a new room
  createRoom: protectedProcedure
    .input(
      z.object({
        gameType: z.nativeEnum(GameType),
        roomName: z.string().min(1).max(50).optional(),
        maxUsers: z.number().min(2).max(32).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {

      // only allow user to be in one active room at a time
      const activeRoom = await ctx.db.room.findFirst({
        where: {
          users: {
            some: { id: ctx.session.userId },
          },
          isActive: true,
        },
      });

      if (activeRoom) {
        throw new Error("You are already in an active room");
      }

      // Generate a random room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the room
      const room = await ctx.db.room.create({
        data: {
          name: input.roomName ?? `Room ${roomCode}`,
          code: roomCode,
          gameType: input.gameType,
          maxUsers: input.maxUsers ?? 16,
          status: "SETUP", // Set initial status to setup
          creatorId: ctx.session.userId, // Set the creator
        },
        include: {
          users: true,
          creator: true,
        },
      });

      // Add user to room
      await ctx.db.room.update({
        where: { id: room.id },
        data: {
          users: {
            connect: { id: ctx.session.userId },
          },
        },
      });

      return room;
    }),

  // Join a room by room code
  joinRoom: protectedProcedure
    .input(
      z.object({
        roomCode: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {

      // only allow user to be in one active room at a time
      const activeRoom = await ctx.db.room.findFirst({
        where: {
          users: {
            some: { id: ctx.session.userId },
          },
          isActive: true,
          NOT: {
            code: input.roomCode.toUpperCase(),
          },
        },
      });

      if (activeRoom) {
        throw new Error("You are already in an active room");
      }

      // Find the room by code
      const room = await ctx.db.room.findFirst({
        where: {
          code: input.roomCode.toUpperCase(),
          isActive: true,
        },
        include: {
          users: true,
          creator: true,
        },
      });

      if (!room) {
        throw new Error("Room not found or not available");
      }

      // Check if room is in a joinable status
      if (room.status === "SETUP") {
        throw new Error("Room is still being set up");
      }

      if (room.status === "IN_PROGRESS") {
        throw new Error("Room is already in progress");
      }

      if (room.status === "COMPLETED") {
        throw new Error("Room has been completed");
      }

      // Check if room is full
      if (room.users && room.users.length >= room.maxUsers) {
        throw new Error("Room is full");
      }

      // Create or find user
      const user = await ctx.db.user.findFirst({
        where: { id: ctx.session.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user is already in the room
      const existingUser = room.users.find(u => u.id === user.id);
      if (existingUser) {
        throw new Error("You are already in this room");
      }

      // Add user to room
      await ctx.db.room.update({
        where: { id: room.id },
        data: {
          users: {
            connect: { id: user.id },
          },
        },
      });

      return room;
    }),

  // Get the current room for the user
  getCurrentRoom: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findFirst({
      where: {
        id: ctx.session.userId,
      },
      include: {
        rooms: {
          include: {
            users: true,
            creator: true,
          },
        },
      },
    });

    const activeRoom = Array.isArray(user?.rooms) ? user.rooms.find((room) => room.isActive) : undefined;

    if (!activeRoom) {
      return null;
    }

    return activeRoom;
  }),

  // Get room details by room code
  getRoomByCode: publicProcedure
    .input(z.object({ roomCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.room.findFirst({
        where: {
          code: input.roomCode.toUpperCase(),
          isActive: true,
        },
        include: {
          users: true,
          creator: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!room) {
        return null;
      }

      return room;
    }),

  // Get all available rooms that can be joined
  getAvailableRooms: publicProcedure.query(async ({ ctx }) => {
    const rooms = await ctx.db.room.findMany({
      where: {
        isActive: true,
        status: {
          in: ["WAITING_FOR_PLAYERS", "IN_PROGRESS"], // Only show waiting and in-progress rooms
        },
      },
      include: {
        users: true,
        creator: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return rooms;
  }),

  // Get rooms that the current user can see (including their own setup rooms)
  getVisibleRooms: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.userId ?? "null";
    const rooms = await ctx.db.room.findMany({
      where: {
        isActive: true,
        OR: [
          {
            status: "WAITING_FOR_PLAYERS", // Anyone can see waiting rooms
          },
          {
            status: "IN_PROGRESS", // Anyone can see in-progress rooms
          },
          {
            status: "SETUP",
            users: {
              some: {
                id: userId, // Only creator can see setup rooms
              },
            },
          },
        ],
      },
      include: {
        users: true,
        creator: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return rooms;
  }),

  // Update room status
  updateRoomStatus: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        status: z.enum(["SETUP", "WAITING_FOR_PLAYERS", "IN_PROGRESS", "COMPLETED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is the creator of the room
      const room = await ctx.db.room.findFirst({
        where: {
          id: input.roomId,
          creatorId: ctx.session.userId, // Only creator can change status
        },
      });

      if (!room) {
        throw new Error("Room not found or you are not the creator");
      }

      // Update room status
      const updatedRoom = await ctx.db.room.update({
        where: { id: input.roomId },
        data: {
          status: input.status,
        },
        include: {
          users: true,
          creator: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return updatedRoom;
    }),

});
