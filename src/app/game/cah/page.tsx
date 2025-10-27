"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { socket } from "~/lib/socketClient";

// Components
import { DeckSelection } from "~/components/cah/deck-selection";
import { GameSettings } from "~/components/cah/game-settings";
import { PlayerList } from "~/components/cah/player-list";
import { GamePhase } from "~/components/cah/game-phase";
import { CardHand, BlackCardDisplay } from "~/components/cah/game-card";
import { GameEnd } from "~/components/cah/game-end";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

// Icons
import {
  ArrowLeft,
  Crown,
  Play,
  AlertCircle
} from "lucide-react";

import type { CAHGameState, CAHSetupConfig } from "~/types/cah";

export default function CAHGamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<CAHGameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [setupPhase, setSetupPhase] = useState<'decks' | 'settings'>('decks');
  const [setupConfig, setSetupConfig] = useState<CAHSetupConfig>({
    selectedDecks: [],
    winningScore: 5,
    allowPlayerJoinsAfterStart: false,
  });

  // TRPC Queries
  const { data: currentRoom } = api.room.getCurrentRoom.useQuery();
  const { data: decks } = api.cah.getDecks.useQuery();
  const { data: gameStateData, refetch: refetchGameState } = api.cah.getGameState.useQuery(
    { roomId: currentRoom?.id ?? "" },
    { enabled: !!currentRoom?.id }
  );

  // TRPC Mutations
  const createGameMutation = api.cah.createGame.useMutation({
    onSuccess: () => {
      toast.success("Game created successfully!");
      void refetchGameState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const startGameMutation = api.cah.startGame.useMutation({
    onSuccess: () => {
      toast.success("Game started!");
      void refetchGameState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitCardsMutation = api.cah.submitCards.useMutation({
    onSuccess: () => {
      toast.success("Cards submitted!");
      setSelectedCards([]);
      void refetchGameState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const voteMutation = api.cah.voteForSubmission.useMutation({
    onSuccess: () => {
      toast.success("Vote cast!");
      void refetchGameState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const startNextRoundMutation = api.cah.startNextRound.useMutation({
    onSuccess: (data) => {
      if (data.gameEnded) {
        toast.success("Game completed!");
      } else {
        toast.success("Next round started!");
      }
      void refetchGameState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Socket connection
  useEffect(() => {
    if (!currentRoom?.id) return;

    socket.emit('join-room', currentRoom.id);

    socket.on('game:state-changed', (newGameState: CAHGameState) => {
      setGameState(newGameState);
    });

    socket.on('game:error', (error: string) => {
      toast.error(error);
    });

    return () => {
      socket.emit('leave-room', currentRoom.id);
      socket.off('game:state-changed');
      socket.off('game:error');
    };
  }, [currentRoom?.id]);

  // Update game state when data changes
  useEffect(() => {
    if (gameStateData) {
      setGameState(gameStateData as unknown as CAHGameState);
    }
  }, [gameStateData]);

  // Handle game creation
  const handleCreateGame = () => {
    if (!currentRoom?.id) return;

    createGameMutation.mutate({
      roomId: currentRoom.id,
      name: setupConfig.gameName ?? `CAH Game ${currentRoom.code}`,
      selectedDecks: setupConfig.selectedDecks,
      winningScore: setupConfig.winningScore,
      allowPlayerJoinsAfterStart: setupConfig.allowPlayerJoinsAfterStart,
    });
  };

  // Handle game start
  const handleStartGame = () => {
    if (!gameState?.game.id) return;
    startGameMutation.mutate({ gameId: gameState.game.id });
  };

  // Handle card submission
  const handleSubmitCards = () => {
    if (!gameState?.game.id || selectedCards.length === 0) return;
    submitCardsMutation.mutate({
      gameId: gameState.game.id,
      cardIds: selectedCards,
    });
  };

  // Handle voting
  const handleVote = (submissionId: string) => {
    if (!gameState?.game.id) return;
    voteMutation.mutate({
      gameId: gameState.game.id,
      submissionId,
    });
  };

  // Handle next round
  const handleStartNextRound = () => {
    if (!gameState?.game.id) return;
    startNextRoundMutation.mutate({ gameId: gameState.game.id });
  };

  // Handle play again
  const handlePlayAgain = () => {
    window.location.reload();
  };

  // Handle share results
  const handleShareResults = () => {
    if (navigator.share) {
      void navigator.share({
        title: 'Cards Against Humanity Game Results',
        text: `Check out my Cards Against Humanity game results!`,
        url: window.location.href,
      });
    } else {
      // Fallback to copying to clipboard
      void navigator.clipboard.writeText(window.location.href);
      toast.success('Game link copied to clipboard!');
    }
  };

  // Handle card selection
  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // If no room, redirect to lobby
  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Active Room</h2>
            <p className="text-muted-foreground mb-4">
              You need to join a room to play Cards Against Humanity.
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no game exists, show setup
  if (!gameState?.game) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <h1 className="text-3xl font-bold">Cards Against Humanity</h1>
            <p className="text-muted-foreground">
              Room: {currentRoom.code} • {currentRoom.users.length} players
            </p>
          </div>

          {/* Setup Flow */}
          <AnimatePresence mode="wait">
            {setupPhase === 'decks' && (
              <motion.div
                key="decks"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DeckSelection
                  decks={decks ?? []}
                  selectedDecks={setupConfig.selectedDecks}
                  onSelectionChange={(decks) =>
                    setSetupConfig(prev => ({ ...prev, selectedDecks: decks }))
                  }
                  onNext={() => setSetupPhase('settings')}
                  disabled={createGameMutation.isPending}
                />
              </motion.div>
            )}

            {setupPhase === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GameSettings
                  config={setupConfig}
                  onConfigChange={setSetupConfig}
                  onBack={() => setSetupPhase('decks')}
                  onStart={handleCreateGame}
                  disabled={createGameMutation.isPending}
                  playerCount={currentRoom.users.length}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Show game end screen
  if (gameState.gamePhase === 'game_end') {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
          </div>

          <GameEnd
            game={gameState.game}
            currentPlayerId={gameState.currentPlayer?.userId}
            onPlayAgain={handlePlayAgain}
            onShare={handleShareResults}
          />
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Cards Against Humanity</h1>
              <p className="text-muted-foreground">
                Room: {currentRoom.code} • Round {gameState.currentRound?.roundNumber ?? 1}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave Game
            </Button>
          </div>

          {/* Game Status */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {gameState.gamePhase === 'lobby' ? 'Lobby' :
                gameState.gamePhase === 'playing' ? 'Playing' :
                  gameState.gamePhase === 'judging' ? 'Judging' :
                    gameState.gamePhase === 'round_end' ? 'Round End' : 'Game End'}
            </Badge>
            {gameState.isCzar && (
              <Badge className="bg-yellow-500 text-black">
                <Crown className="w-3 h-3 mr-1" />
                You are the Czar
              </Badge>
            )}
          </div>
        </div>

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Players */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerList
              players={gameState.game.players}
              currentPlayerId={gameState.currentPlayer?.userId}
              showScores={true}
              showHandSize={gameState.gamePhase === 'playing'}
            />
          </div>

          {/* Main Game Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Black Card Display */}
            {gameState.currentRound && (
              <BlackCardDisplay
                card={gameState.currentRound.blackCard}
                pickCount={gameState.currentRound.pick}
              />
            )}

            {/* Game Phase Controls */}
            <GamePhase
              gameState={gameState}
              onStartGame={handleStartGame}
              onStartNextRound={handleStartNextRound}
              onVote={handleVote}
            />

            {/* Player Hand */}
            {gameState.currentPlayer &&
              gameState.gamePhase === 'playing' &&
              !gameState.isCzar && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Hand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardHand
                      cards={gameState.currentPlayer.hand.map(h => h.CAHgameCard)}
                      selectedCards={selectedCards}
                      onCardSelect={handleCardSelect}
                      maxSelection={gameState.currentRound?.pick ?? 1}
                    />

                    {selectedCards.length === (gameState.currentRound?.pick ?? 1) && (
                      <div className="mt-4 text-center">
                        <Button
                          onClick={handleSubmitCards}
                          disabled={submitCardsMutation.isPending}
                          size="lg"
                          className="w-full"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Submit Cards
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Submissions Display (for Czar) */}
            {gameState.gamePhase === 'judging' &&
              gameState.isCzar &&
              gameState.currentRound && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose the Winner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gameState.currentRound.CAHsubmissions.map((submission) => (
                        <Card key={submission.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{submission.player.user.name}</span>
                                <Button
                                  size="sm"
                                  onClick={() => handleVote(submission.id)}
                                  disabled={voteMutation.isPending}
                                >
                                  Vote
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {submission.items.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item.CAHgameCard.card.content}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
