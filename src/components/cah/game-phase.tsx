"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import {
  Clock,
  Users,
  CheckCircle,
  Crown,
  Trophy,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import type { CAHGameState, CAHRoundWithDetails } from "~/types/cah";

interface GamePhaseProps {
  gameState: CAHGameState;
  onStartGame: () => void;
  onStartNextRound: () => void;
  onVote: (submissionId: string) => void;
  className?: string;
}

export function GamePhase({
  gameState,
  onStartGame,
  onStartNextRound,
  onVote,
  className = ""
}: GamePhaseProps) {
  const { game, currentPlayer, currentRound, gamePhase, isCzar } = gameState;

  const renderLobbyPhase = () => (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Waiting to Start
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            {currentPlayer?.isAdmin
              ? "You can start the game when ready"
              : "Waiting for the game creator to start the game"
            }
          </p>

          {currentPlayer?.isAdmin && (
            <Button onClick={onStartGame} size="lg" className="mt-4">
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Players:</span>
            <Badge variant="secondary">{game.players.length}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Winning Score:</span>
            <Badge variant="outline">{game.winningScore} points</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span>Selected Decks:</span>
            <Badge variant="outline">{game.decks.length} decks</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPlayingPhase = () => {
    if (!currentRound) return null;

    const submittedCount = currentRound.CAHsubmissions.length;
    const totalPlayers = game.players.filter(p => p.id !== currentRound.czarPlayerId).length;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Waiting for Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Submissions received:</span>
              <Badge variant="secondary">
                {submittedCount} / {totalPlayers}
              </Badge>
            </div>
            <Progress
              value={(submittedCount / totalPlayers) * 100}
              className="h-2"
            />
          </div>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {isCzar
                ? "You are the Czar! Wait for all players to submit their cards."
                : "Submit your cards to continue"
              }
            </p>
          </div>

          {submittedCount === totalPlayers && isCzar && (
            <Button onClick={onStartNextRound} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              All Submissions Received - Start Judging
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderJudgingPhase = () => {
    if (!currentRound) return null;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Czar is Judging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              {isCzar
                ? "Choose the winning submission"
                : `${currentRound.czar.user.name} is choosing the winner...`
              }
            </p>
          </div>

          <div className="space-y-2">
            {currentRound.CAHsubmissions.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {submission.player.user.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Submission {index + 1}
                    </Badge>
                  </div>

                  {isCzar && (
                    <Button
                      size="sm"
                      onClick={() => onVote(submission.id)}
                      variant="outline"
                    >
                      Vote
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRoundEndPhase = () => {
    if (!currentRound) return null;

    const winningSubmission = currentRound.CAHsubmissions.find(s => s.isWinner);
    const isWinner = winningSubmission?.playerId === currentPlayer?.id;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Round Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              {isWinner ? "🎉 You won this round!" : "Round over"}
            </p>
            <p className="text-muted-foreground">
              {winningSubmission
                ? `${winningSubmission.player.user.name} won this round!`
                : "No winner this round"
              }
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Round:</span>
              <Badge variant="outline">{currentRound.roundNumber}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your Score:</span>
              <Badge variant="secondary">{currentPlayer?.score ?? 0} points</Badge>
            </div>
          </div>

          {currentPlayer?.isAdmin && (
            <Button onClick={onStartNextRound} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Next Round
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGameEndPhase = () => {
    const winner = game.players.reduce((prev, current) =>
      (current.score > prev.score) ? current : prev
    );
    const isWinner = winner.id === currentPlayer?.id;

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Game Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold">
              {isWinner ? "🎉 You Won!" : "Game Over"}
            </p>
            <p className="text-lg">
              {winner.user.name} wins with {winner.score} points!
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">Final Scores:</h4>
            {game.players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div key={player.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#{index + 1}</span>
                    <span className={player.id === currentPlayer?.id ? "text-primary font-semibold" : ""}>
                      {player.user.name}
                    </span>
                    {player.id === currentPlayer?.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                  <Badge variant={index === 0 ? "default" : "outline"}>
                    {player.score} pts
                  </Badge>
                </div>
              ))}
          </div>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  };

  switch (gamePhase) {
    case 'lobby':
      return renderLobbyPhase();
    case 'playing':
      return renderPlayingPhase();
    case 'judging':
      return renderJudgingPhase();
    case 'round_end':
      return renderRoundEndPhase();
    case 'game_end':
      return renderGameEndPhase();
    default:
      return null;
  }
}
