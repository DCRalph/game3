"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PlayerNameForm } from "./player-name-form";
import { JoinRoomForm } from "./join-room-form";
import { CreateRoomForm } from "./create-room-form";
import { GameType } from "@prisma/client";

interface RoomActionsProps {
  roomCode: string;
  onRoomCodeChange: (code: string) => void;
  roomName: string;
  onRoomNameChange: (name: string) => void;
  maxUsers: number;
  onMaxUsersChange: (maxUsers: number) => void;
  gameType: GameType;
  onGameTypeChange: (gameType: GameType) => void;
  onJoinGame: (e: React.FormEvent) => void;
  onCreateGame: (e: React.FormEvent) => void;
  joinRoomMutation: {
    isPending: boolean;
    error: { message: string } | null;
  };
  createRoomMutation: {
    isPending: boolean;
    error: { message: string } | null;
  };
}

export function RoomActions({
  roomCode,
  onRoomCodeChange,
  roomName,
  onRoomNameChange,
  maxUsers,
  onMaxUsersChange,
  gameType,
  onGameTypeChange,
  onJoinGame,
  onCreateGame,
  joinRoomMutation,
  createRoomMutation,
}: RoomActionsProps) {
  return (
    <div className="space-y-6">
      {/* Player Name Input */}
      <PlayerNameForm />

      {/* Action Tabs */}
      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join">Join Room</TabsTrigger>
          <TabsTrigger value="create">Create Room</TabsTrigger>
        </TabsList>

        {/* Join Room Tab */}
        <TabsContent value="join">
          <JoinRoomForm
            roomCode={roomCode}
            onRoomCodeChange={onRoomCodeChange}
            onSubmit={onJoinGame}
            isLoading={joinRoomMutation.isPending}
            error={joinRoomMutation.error?.message}
          />
        </TabsContent>

        {/* Create Room Tab */}
        <TabsContent value="create">
          <CreateRoomForm
            roomName={roomName}
            onRoomNameChange={onRoomNameChange}
            maxUsers={maxUsers}
            onMaxUsersChange={onMaxUsersChange}
            gameType={gameType}
            onGameTypeChange={onGameTypeChange}
            onSubmit={onCreateGame}
            isLoading={createRoomMutation.isPending}
            error={createRoomMutation.error?.message}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
