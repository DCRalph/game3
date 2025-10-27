import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const gameRouter = createTRPCRouter({
  // Get all available games/rooms that can be joined
  getAvailableGames: publicProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.room.findMany({
      where: {
        isActive: true,
        CAHGame: {
          status: "LOBBY",
        },
      },
      include: {
        CAHGame: {
          include: {
            players: {
              include: {
                user: true,
              },
            },
          },
        },
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

    return games.map((room) => ({
      id: room.id,
      code: room.code,
      gameType: room.gameType,
      createdAt: room.createdAt,
      playerCount: room._count.users,
      maxPlayers: room.CAHGame?.maxPlayers,
      gameName: room.CAHGame?.name,
      players: room.CAHGame?.players.map((player) => ({
        id: player.id,
        name: player.user.name,
        isAdmin: player.isAdmin,
      })) ?? [],
    }));
  }),

  // Create a new game room
  createGame: publicProcedure
    .input(
      z.object({
        gameType: z.enum(["CAH"]),
        gameName: z.string().min(1).max(50),
        maxPlayers: z.number().min(2).max(20).optional(),
        winningScore: z.number().min(1).max(100).optional(),
        allowPlayerJoinsAfterStart: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a random room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the room
      const room = await ctx.db.room.create({
        data: {
          code: roomCode,
          gameType: input.gameType,
          CAHGame: {
            create: {
              name: input.gameName,
              maxPlayers: input.maxPlayers,
              winningScore: input.winningScore,
              allowPlayerJoinsAfterStart: input.allowPlayerJoinsAfterStart,
            },
          },
        },
        include: {
          CAHGame: true,
        },
      });

      return {
        id: room.id,
        code: room.code,
        gameType: room.gameType,
        gameName: room.CAHGame?.name,
        maxPlayers: room.CAHGame?.maxPlayers,
        winningScore: room.CAHGame?.winningScore,
        allowPlayerJoinsAfterStart: room.CAHGame?.allowPlayerJoinsAfterStart,
      };
    }),

  // Join a game by room code
  joinGame: publicProcedure
    .input(
      z.object({
        roomCode: z.string().min(1),
        playerName: z.string().min(1).max(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the room by code
      const room = await ctx.db.room.findFirst({
        where: {
          code: input.roomCode.toUpperCase(),
          isActive: true,
          CAHGame: {
            status: "LOBBY",
          },
        },
        include: {
          CAHGame: {
            include: {
              players: true,
            },
          },
        },
      });

      if (!room || !room.CAHGame) {
        throw new Error("Game not found or not available");
      }

      // Check if room is full
      if (room.CAHGame.maxPlayers && room.CAHGame.players.length >= room.CAHGame.maxPlayers) {
        throw new Error("Game is full");
      }

      // Create or find user
      let user = await ctx.db.user.findFirst({
        where: { name: input.playerName },
      });


      user ??= await ctx.db.user.create({
        data: {
          name: input.playerName,
        },
      });

      // Check if user is already in the game
      const existingPlayer = await ctx.db.cAHPlayer.findFirst({
        where: {
          userId: user.id,
          gameId: room.CAHGame.id,
        },
      });

      if (existingPlayer) {
        throw new Error("You are already in this game");
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

      // Create player in the game
      const player = await ctx.db.cAHPlayer.create({
        data: {
          userId: user.id,
          gameId: room.CAHGame.id,
          seatNumber: room.CAHGame.players.length,
          isAdmin: room.CAHGame.players.length === 0, // First player is admin
        },
      });

      return {
        success: true,
        roomId: room.id,
        gameId: room.CAHGame.id,
        playerId: player.id,
        isAdmin: player.isAdmin,
      };
    }),

  // Get game details by room code
  getGameByCode: publicProcedure
    .input(z.object({ roomCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.room.findFirst({
        where: {
          code: input.roomCode.toUpperCase(),
          isActive: true,
        },
        include: {
          CAHGame: {
            include: {
              players: {
                include: {
                  user: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!room || !room.CAHGame) {
        return null;
      }

      return {
        id: room.id,
        code: room.code,
        gameType: room.gameType,
        gameName: room.CAHGame.name,
        status: room.CAHGame.status,
        maxPlayers: room.CAHGame.maxPlayers,
        winningScore: room.CAHGame.winningScore,
        allowPlayerJoinsAfterStart: room.CAHGame.allowPlayerJoinsAfterStart,
        playerCount: room._count.users,
        players: room.CAHGame.players.map((player) => ({
          id: player.id,
          name: player.user.name,
          isAdmin: player.isAdmin,
          score: player.score,
        })),
        createdAt: room.createdAt,
      };
    }),
});
