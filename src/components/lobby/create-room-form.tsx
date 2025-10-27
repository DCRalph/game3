"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { GameType } from "@prisma/client";

interface CreateRoomFormProps {
  roomName: string;
  onRoomNameChange: (name: string) => void;
  maxUsers: number;
  onMaxUsersChange: (maxUsers: number) => void;
  gameType: GameType;
  onGameTypeChange: (gameType: GameType) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error?: string | null;
}

export function CreateRoomForm({
  roomName,
  onRoomNameChange,
  maxUsers,
  onMaxUsersChange,
  gameType,
  onGameTypeChange,
  onSubmit,
  isLoading,
  error
}: CreateRoomFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create New Room</CardTitle>
        <CardDescription>
          Start a new game room for others to join
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="Enter room name"
              value={roomName}
              onChange={(e) => onRoomNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsers">Max Players</Label>
            <Select value={maxUsers.toString()} onValueChange={(value) => onMaxUsersChange(parseInt(value))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[4, 6, 8, 10, 12, 16, 20, 32].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} players
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gameType">Game Type</Label>
            <Select value={gameType} onValueChange={(value: GameType) => onGameTypeChange(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GameType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!roomName.trim() || isLoading}
          >
            {isLoading ? "Creating..." : "Create Room"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card >
  );
}
