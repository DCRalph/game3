import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { CAHGameStatus, CAHRoundStatus } from "@prisma/client";
import type { CAHGameWithDetails, CAHPlayerWithUser, CAHRoundWithDetails } from "~/types/cah";

export const cahRouter = createTRPCRouter({
  // Get available decks
  getDecks: publicProcedure.query(async ({ ctx }) => {
    const decks = await ctx.db.cAHDeck.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
        cards: {
          where: { isActive: true },
          select: {
            type: true,
          },
        },
      },
    });

    return decks.map(deck => ({
      id: deck.id,
      name: deck.name,
      whiteCount: deck.cards.filter(card => card.type === 'WHITE').length,
      blackCount: deck.cards.filter(card => card.type === 'BLACK').length,
      totalCards: deck._count.cards,
    }));
  }),

  // Create a new CAH game
  createGame: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        name: z.string().min(1).max(100),
        selectedDecks: z.array(z.string()),
        winningScore: z.number().min(1).max(50).default(5),
        allowPlayerJoinsAfterStart: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is the creator of the room
      const room = await ctx.db.room.findFirst({
        where: {
          id: input.roomId,
          creatorId: ctx.session.userId,
        },
        include: {
          users: true,
        },
      });

      if (!room) {
        throw new Error("Room not found or you are not the creator");
      }

      if (room.gameType !== "CAH") {
        throw new Error("Room is not configured for CAH");
      }

      // Check if game already exists
      const existingGame = await ctx.db.cAHGame.findFirst({
        where: { roomId: input.roomId },
      });

      if (existingGame) {
        throw new Error("Game already exists for this room");
      }

      // Create the game
      const game = await ctx.db.cAHGame.create({
        data: {
          name: input.name,
          roomId: input.roomId,
          status: "LOBBY",
          winningScore: input.winningScore,
          allowPlayerJoinsAfterStart: input.allowPlayerJoinsAfterStart,
          shuffleSeed: Math.random().toString(36).substring(2, 15),
        },
      });

      // Add selected decks
      for (let i = 0; i < input.selectedDecks.length; i++) {
        await ctx.db.cAHGameDeck.create({
          data: {
            gameId: game.id,
            deckId: input.selectedDecks[i]!,
            includeWhite: true,
            includeBlack: true,
            position: i,
          },
        });
      }

      // Add all users as players
      for (let i = 0; i < room.users.length; i++) {
        const user = room.users[i]!;
        await ctx.db.cAHPlayer.create({
          data: {
            userId: user.id,
            gameId: game.id,
            seatNumber: i,
            isActive: true,
            isAdmin: user.id === ctx.session.userId,
          },
        });
      }

      return game;
    }),

  // Get game state
  getGameState: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      const game = await ctx.db.cAHGame.findFirst({
        where: { roomId: input.roomId },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              hand: {
                include: {
                  CAHgameCard: {
                    include: {
                      card: true,
                    },
                  },
                },
                orderBy: { position: 'asc' },
              },
              CAHsubmissions: {
                include: {
                  items: {
                    include: {
                      CAHgameCard: {
                        include: {
                          card: true,
                        },
                      },
                    },
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
            orderBy: { seatNumber: 'asc' },
          },
          rounds: {
            include: {
              blackCard: true,
              czar: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              CAHsubmissions: {
                include: {
                  items: {
                    include: {
                      CAHgameCard: {
                        include: {
                          card: true,
                        },
                      },
                    },
                    orderBy: { position: 'asc' },
                  },
                  player: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              submittedCards: {
                include: {
                  card: true,
                },
              },
              winningWhiteCards: true,
            },
            orderBy: { roundNumber: 'asc' },
          },
          decks: {
            include: {
              deck: true,
            },
            orderBy: { position: 'asc' },
          },
          CAHgameCards: {
            include: {
              card: true,
            },
          },
        },
      });

      if (!game) {
        return null;
      }

      const currentPlayer = game.players.find(p => p.userId === ctx.session.userId);
      const currentRound = game.rounds.find(r => r.status !== 'COMPLETED');

      let gamePhase: 'setup' | 'lobby' | 'playing' | 'judging' | 'round_end' | 'game_end' = 'lobby';

      if (game.status === 'LOBBY') {
        gamePhase = 'lobby';
      } else if (game.status === 'IN_PROGRESS') {
        if (currentRound) {
          if (currentRound.status === 'WAITING_FOR_CAHSUBMISSIONS') {
            gamePhase = 'playing';
          } else if (currentRound.status === 'WAITING_FOR_JUDGMENT') {
            gamePhase = 'judging';
          } else {
            gamePhase = 'round_end';
          }
        } else {
          gamePhase = 'game_end';
        }
      } else if (game.status === 'COMPLETED') {
        gamePhase = 'game_end';
      }

      const isCzar = currentRound?.czarPlayerId === currentPlayer?.id;
      const hasSubmitted = currentRound ? game.players.some(p =>
        p.CAHsubmissions.some(s => s.roundId === currentRound.id)
      ) : false;

      return {
        game,
        currentPlayer,
        currentRound,
        isCzar,
        canSubmit: !isCzar && currentRound?.status === 'WAITING_FOR_CAHSUBMISSIONS' && currentPlayer?.isActive,
        hasSubmitted,
        selectedCards: [],
        gamePhase,
      };
    }),

  // Start the game
  startGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.cAHGame.findFirst({
        where: {
          id: input.gameId,
          players: {
            some: {
              userId: ctx.session.userId,
              isAdmin: true,
            },
          },
        },
        include: {
          players: {
            where: { isActive: true },
          },
        },
      });

      if (!game) {
        throw new Error("Game not found or you are not an admin");
      }

      if (game.status !== "LOBBY") {
        throw new Error("Game is not in lobby status");
      }

      if (game.players.length < 3) {
        throw new Error("Need at least 3 players to start");
      }

      // Initialize game cards
      await initializeGameCards(ctx, game.id);

      // Deal initial hands
      await dealInitialHands(ctx, game.id);

      // Start first round
      const firstRound = await startNewRound(ctx, game.id, 1);

      // Update game status
      await ctx.db.cAHGame.update({
        where: { id: input.gameId },
        data: { status: "IN_PROGRESS" },
      });

      return { success: true, round: firstRound };
    }),

  // Submit cards for current round
  submitCards: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        cardIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.cAHGame.findFirst({
        where: { id: input.gameId },
        include: {
          rounds: {
            where: { status: "WAITING_FOR_CAHSUBMISSIONS" },
            include: { blackCard: true },
          },
        },
      });

      if (!game) {
        throw new Error("Game not found");
      }

      const currentRound = game.rounds[0];
      if (!currentRound) {
        throw new Error("No active round found");
      }

      const player = await ctx.db.cAHPlayer.findFirst({
        where: {
          gameId: input.gameId,
          userId: ctx.session.userId,
        },
      });

      if (!player) {
        throw new Error("Player not found");
      }

      if (player.id === currentRound.czarPlayerId) {
        throw new Error("Czar cannot submit cards");
      }

      // Check if already submitted
      const existingSubmission = await ctx.db.cAHSubmission.findFirst({
        where: {
          roundId: currentRound.id,
          playerId: player.id,
        },
      });

      if (existingSubmission) {
        throw new Error("Already submitted for this round");
      }

      // Validate card count
      if (input.cardIds.length !== currentRound.pick) {
        throw new Error(`Must submit exactly ${currentRound.pick} cards`);
      }

      // Validate cards belong to player
      const playerCards = await ctx.db.cAHGameCard.findMany({
        where: {
          gameId: input.gameId,
          holderPlayerId: player.id,
          state: "IN_HAND",
        },
      });

      const validCardIds = playerCards.map(card => card.id);
      const invalidCards = input.cardIds.filter(id => !validCardIds.includes(id));

      if (invalidCards.length > 0) {
        throw new Error("Invalid cards selected");
      }

      // Create submission
      const submission = await ctx.db.cAHSubmission.create({
        data: {
          roundId: currentRound.id,
          playerId: player.id,
        },
      });

      // Create submission items and update card states
      for (let i = 0; i < input.cardIds.length; i++) {
        const cardId = input.cardIds[i]!;

        await ctx.db.cAHSubmissionItem.create({
          data: {
            CAHsubmissionId: submission.id,
            CAHgameCardId: cardId,
            position: i,
          },
        });

        await ctx.db.cAHGameCard.update({
          where: { id: cardId },
          data: {
            state: "SUBMITTED",
            submittedRoundId: currentRound.id,
          },
        });
      }

      return { success: true, submission };
    }),

  // Vote for a submission
  voteForSubmission: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        submissionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.cAHGame.findFirst({
        where: { id: input.gameId },
        include: {
          rounds: {
            where: { status: "WAITING_FOR_JUDGMENT" },
          },
        },
      });

      if (!game) {
        throw new Error("Game not found");
      }

      const currentRound = game.rounds[0];
      if (!currentRound) {
        throw new Error("No active round found");
      }

      const player = await ctx.db.cAHPlayer.findFirst({
        where: {
          gameId: input.gameId,
          userId: ctx.session.userId,
        },
      });

      if (!player) {
        throw new Error("Player not found");
      }

      if (player.id !== currentRound.czarPlayerId) {
        throw new Error("Only the czar can vote");
      }

      // Mark submission as winner
      await ctx.db.cAHSubmission.update({
        where: { id: input.submissionId },
        data: { isWinner: true },
      });

      // Update round status
      await ctx.db.cAHRound.update({
        where: { id: currentRound.id },
        data: { status: "COMPLETED" },
      });

      // Award points to winning player
      const winningSubmission = await ctx.db.cAHSubmission.findFirst({
        where: { id: input.submissionId },
        include: { player: true },
      });

      if (winningSubmission) {
        await ctx.db.cAHPlayer.update({
          where: { id: winningSubmission.playerId },
          data: {
            score: { increment: 1 },
          },
        });
      }

      return { success: true };
    }),

  // Start next round
  startNextRound: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.cAHGame.findFirst({
        where: { id: input.gameId },
        include: {
          players: {
            where: { isActive: true },
            orderBy: { seatNumber: 'asc' },
          },
          rounds: {
            orderBy: { roundNumber: 'desc' },
            take: 1,
          },
        },
      });

      if (!game) {
        throw new Error("Game not found");
      }

      const lastRound = game.rounds[0];
      const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

      // Check if game should end
      const maxScore = Math.max(...game.players.map(p => p.score));
      if (maxScore >= (game.winningScore ?? 5)) {
        await ctx.db.cAHGame.update({
          where: { id: input.gameId },
          data: { status: "COMPLETED" },
        });
        return { success: true, gameEnded: true };
      }

      // Start new round
      const newRound = await startNewRound(ctx, input.gameId, nextRoundNumber);

      return { success: true, round: newRound, gameEnded: false };
    }),
});

// Helper functions
async function initializeGameCards(ctx: any, gameId: string) {
  const game = await ctx.db.cAHGame.findFirst({
    where: { id: gameId },
    include: {
      decks: {
        include: {
          deck: {
            include: {
              cards: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });

  if (!game) return;

  const gameCards = [];
  let drawOrder = 0;

  for (const gameDeck of game.decks) {
    const { deck } = gameDeck;

    for (const card of deck.cards) {
      if ((card.type === 'WHITE' && gameDeck.includeWhite) ||
        (card.type === 'BLACK' && gameDeck.includeBlack)) {
        gameCards.push({
          gameId,
          cardId: card.id,
          state: 'IN_DRAW_PILE',
          drawOrder: drawOrder++,
        });
      }
    }
  }

  // Shuffle using game's shuffle seed
  const shuffled = shuffleArray(gameCards, game.shuffleSeed);

  await ctx.db.cAHGameCard.createMany({
    data: shuffled,
  });
}

async function dealInitialHands(ctx: any, gameId: string) {
  const game = await ctx.db.cAHGame.findFirst({
    where: { id: gameId },
    include: {
      players: {
        where: { isActive: true },
      },
    },
  });

  if (!game) return;

  const cardsPerPlayer = 7; // Standard CAH hand size
  const totalCardsNeeded = game.players.length * cardsPerPlayer;

  // Get cards from draw pile
  const availableCards = await ctx.db.cAHGameCard.findMany({
    where: {
      gameId,
      state: 'IN_DRAW_PILE',
    },
    orderBy: { drawOrder: 'asc' },
    take: totalCardsNeeded,
  });

  let cardIndex = 0;

  for (const player of game.players) {
    const playerCards = availableCards.slice(cardIndex, cardIndex + cardsPerPlayer);
    cardIndex += cardsPerPlayer;

    for (let i = 0; i < playerCards.length; i++) {
      const gameCard = playerCards[i]!;

      // Update card state
      await ctx.db.cAHGameCard.update({
        where: { id: gameCard.id },
        data: {
          state: 'IN_HAND',
          holderPlayerId: player.id,
        },
      });

      // Add to player hand
      await ctx.db.cAHPlayerHand.create({
        data: {
          playerId: player.id,
          CAHgameCardId: gameCard.id,
          position: i,
        },
      });
    }
  }
}

async function startNewRound(ctx: any, gameId: string, roundNumber: number) {
  const game = await ctx.db.cAHGame.findFirst({
    where: { id: gameId },
    include: {
      players: {
        where: { isActive: true },
        orderBy: { seatNumber: 'asc' },
      },
    },
  });

  if (!game) throw new Error("Game not found");

  // Determine czar (rotate through players)
  const czarIndex = (roundNumber - 1) % game.players.length;
  const czar = game.players[czarIndex]!;

  // Get a black card
  const blackCard = await ctx.db.cAHGameCard.findFirst({
    where: {
      gameId,
      state: 'IN_DRAW_PILE',
      card: {
        type: 'BLACK',
      },
    },
    include: {
      card: true,
    },
    orderBy: { drawOrder: 'asc' },
  });

  if (!blackCard) {
    throw new Error("No black cards available");
  }

  // Update black card state
  await ctx.db.cAHGameCard.update({
    where: { id: blackCard.id },
    data: { state: 'USED' },
  });

  // Create round
  const round = await ctx.db.cAHRound.create({
    data: {
      gameId,
      roundNumber,
      czarPlayerId: czar.id,
      blackCardId: blackCard.cardId,
      pick: blackCard.card.pick ?? 1,
      draw: blackCard.card.draw ?? 0,
    },
  });

  return round;
}

function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];

  if (seed) {
    // Simple seeded shuffle
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    for (let i = shuffled.length - 1; i > 0; i--) {
      hash = (hash * 1664525 + 1013904223) % 4294967296;
      const j = Math.abs(hash) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
  }

  return shuffled;
}
