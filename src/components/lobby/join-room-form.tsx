"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface JoinRoomFormProps {
  roomCode: string;
  onRoomCodeChange: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error?: string | null;
}

export function JoinRoomForm({
  roomCode,
  onRoomCodeChange,
  onSubmit,
  isLoading,
  error
}: JoinRoomFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Join Existing Room</CardTitle>
        <CardDescription>
          Enter a room code to join an existing game
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinRoomCode">Room Code</Label>
            <Input
              id="joinRoomCode"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!roomCode.trim() || isLoading}
          >
            {isLoading ? "Joining..." : "Join Room"}
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
    </Card>
  );
}
