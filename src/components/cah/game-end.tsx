"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Trophy,
  Crown,
  RotateCcw,
  Share2,
  Download,
  Calendar,
  Clock,
  Users
} from "lucide-react";
import type { CAHGameWithDetails, CAHPlayerWithUser } from "~/types/cah";

interface GameEndProps {
  game: CAHGameWithDetails;
  currentPlayerId?: string;
  onPlayAgain: () => void;
  onShare: () => void;
  className?: string;
}

export function GameEnd({
  game,
  currentPlayerId,
  onPlayAgain,
  onShare,
  className = ""
}: GameEndProps) {
  const winner = game.players.reduce((prev, current) =>
    (current.score > prev.score) ? current : prev
  );
  const isWinner = winner.id === currentPlayerId;
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

  const gameDuration = game.rounds.length > 0
    ? Math.round((Date.now() - new Date(game.createdAt).getTime()) / (1000 * 60))
    : 0;

  const totalRounds = game.rounds.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`space-y-6 ${className}`}
    >
      {/* Winner Announcement */}
      <Card className="bg-linear-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-4"
          >
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          </motion.div>

          <h2 className="text-3xl font-bold mb-2">
            {isWinner ? "🎉 You Won!" : "Game Complete!"}
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-yellow-500" />
            <span className="text-xl font-semibold">
              {winner.user.name} wins!
            </span>
            <Badge className="bg-yellow-500 text-black text-lg px-3 py-1">
              {winner.score} points
            </Badge>
          </div>

          <p className="text-muted-foreground">
            {isWinner
              ? "Congratulations on your victory!"
              : "Better luck next time!"
            }
          </p>
        </CardContent>
      </Card>

      {/* Game Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{game.players.length}</div>
            <div className="text-sm text-muted-foreground">Players</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{totalRounds}</div>
            <div className="text-sm text-muted-foreground">Rounds</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{gameDuration}m</div>
            <div className="text-sm text-muted-foreground">Duration</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{game.winningScore}</div>
            <div className="text-sm text-muted-foreground">Winning Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Final Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Final Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                const isCurrentPlayer = player.userId === currentPlayerId;
                const isPodium = index < 3;

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-colors
                      ${isPodium ? 'bg-linear-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''}
                      ${isCurrentPlayer ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                        ${index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                              'bg-muted text-muted-foreground'}
                      `}>
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isCurrentPlayer ? 'text-primary' : ''}`}>
                            {player.user.name}
                          </span>
                          {isCurrentPlayer && (
                            <Badge variant="secondary" className="text-xs">
                              You
                            </Badge>
                          )}
                          {index === 0 && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        {isPodium && (
                          <div className="text-xs text-muted-foreground">
                            {index === 0 ? '🥇 Champion' :
                              index === 1 ? '🥈 Runner-up' : '🥉 Third Place'}
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={isPodium ? "default" : "outline"}
                      className="text-lg px-3 py-1"
                    >
                      {player.score} pts
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Round History */}
      {game.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {game.rounds.map((round, index) => {
                  const roundWinner = round.CAHsubmissions.find(s => s.isWinner);

                  return (
                    <motion.div
                      key={round.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Round {round.roundNumber}
                        </Badge>
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-48">
                            {round.blackCard.content}
                          </div>
                          {roundWinner && (
                            <div className="text-muted-foreground text-xs">
                              Won by {roundWinner.player.user.name}
                            </div>
                          )}
                        </div>
                      </div>

                      {roundWinner && (
                        <Badge variant="secondary" className="text-xs">
                          {roundWinner.player.user.name}
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </Button>

        <Button
          onClick={onShare}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
      </div>
    </motion.div>
  );
}
