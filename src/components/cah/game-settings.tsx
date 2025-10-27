"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Settings, Trophy, Users, Clock, ArrowLeft } from "lucide-react";
import type { CAHSetupConfig } from "~/types/cah";

interface GameSettingsProps {
  config: CAHSetupConfig;
  onConfigChange: (config: CAHSetupConfig) => void;
  onBack: () => void;
  onStart: () => void;
  disabled?: boolean;
  playerCount: number;
}

export function GameSettings({
  config,
  onConfigChange,
  onBack,
  onStart,
  disabled = false,
  playerCount
}: GameSettingsProps) {
  const [localConfig, setLocalConfig] = useState<CAHSetupConfig>(config);

  const handleConfigChange = (updates: Partial<CAHSetupConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const canStart = localConfig.selectedDecks.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto p-4"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Game Settings</h2>
        <p className="text-muted-foreground">
          Configure your Cards Against Humanity game
        </p>
      </div>

      <div className="space-y-6">
        {/* Game Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameName">Game Name</Label>
              <Input
                id="gameName"
                placeholder="Enter game name..."
                value={localConfig.gameName ?? ""}
                onChange={(e) => handleConfigChange({ gameName: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Winning Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Winning Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="winningScore">Winning Score</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="winningScore"
                  type="number"
                  min="1"
                  max="50"
                  value={localConfig.winningScore}
                  onChange={(e) => handleConfigChange({
                    winningScore: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                  })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">points to win</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Players need to win this many rounds to win the game
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Player Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Player Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowJoins">Allow Late Joins</Label>
                <p className="text-xs text-muted-foreground">
                  Let players join after the game has started
                </p>
              </div>
              <Switch
                id="allowJoins"
                checked={localConfig.allowPlayerJoinsAfterStart}
                onCheckedChange={(checked) =>
                  handleConfigChange({ allowPlayerJoinsAfterStart: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Game Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Players</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {playerCount}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {playerCount >= 3 ? "Ready to start" : "Need at least 3 players"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selected Decks</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {localConfig.selectedDecks.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    deck{localConfig.selectedDecks.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Estimated Game Duration</Label>
              <div className="text-sm text-muted-foreground">
                {localConfig.winningScore * playerCount * 2}-{localConfig.winningScore * playerCount * 4} minutes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Decks
          </Button>

          <Button
            onClick={onStart}
            disabled={!canStart || disabled}
            size="lg"
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Start Game
          </Button>
        </div>

        {!canStart && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {playerCount < 3
                ? "Need at least 3 players to start the game"
                : "Please select at least one deck to start the game"
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
