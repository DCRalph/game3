"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Users, Crown, User } from "lucide-react";
import type { CAHPlayerWithUser } from "~/types/cah";

interface PlayerListProps {
  players: CAHPlayerWithUser[];
  currentPlayerId?: string;
  showScores?: boolean;
  showHandSize?: boolean;
  className?: string;
}

export function PlayerList({
  players,
  currentPlayerId,
  showScores = false,
  showHandSize = false,
  className = ""
}: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => a.seatNumber - b.seatNumber);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.userId === currentPlayerId;
          const isAdmin = player.isAdmin;
          const handSize = player.hand?.length || 0;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isCurrentPlayer
                ? "bg-primary/10 border-primary/20"
                : "hover:bg-muted/50"
                }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {player.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isCurrentPlayer ? "text-primary" : ""}`}>
                      {player.user.name}
                    </span>
                    {isAdmin && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {isCurrentPlayer && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>

                  {showHandSize && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {handSize} cards
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showScores && (
                  <Badge variant="outline" className="text-sm">
                    {player.score} pts
                  </Badge>
                )}

                <div className="flex items-center gap-1">
                  {player.isActive ? (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {players.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No players yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlayerScoreboardProps {
  players: CAHPlayerWithUser[];
  currentPlayerId?: string;
  className?: string;
}

export function PlayerScoreboard({
  players,
  currentPlayerId,
  className = ""
}: PlayerScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.userId === currentPlayerId;
          const isLeader = index === 0 && player.score > 0;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg ${isLeader
                ? "bg-yellow-50 border-yellow-200 border"
                : isCurrentPlayer
                  ? "bg-primary/10"
                  : "hover:bg-muted/50"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                  {index + 1}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCurrentPlayer ? "text-primary" : ""}`}>
                    {player.user.name}
                  </span>
                  {isLeader && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                  {isCurrentPlayer && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={isLeader ? "default" : "outline"}
                  className="text-sm"
                >
                  {player.score} pts
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
