"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { LobbyHeader } from "~/components/lobby/lobby-header";
import { RoomsList } from "~/components/lobby/rooms-list";
import { RoomActions } from "~/components/lobby/room-actions";
import { GameType } from "@prisma/client";

export default function LobbyPage() {
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [maxUsers, setMaxUsers] = useState(8);
  const [gameType, setGameType] = useState<GameType>(GameType.CAH);

  const { data: availableRooms, isLoading: roomsLoading } = api.room.getAvailableRooms.useQuery();
  const createRoomMutation = api.room.createRoom.useMutation();
  const joinRoomMutation = api.room.joinRoom.useMutation();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const result = await createRoomMutation.mutateAsync({
        gameType: "CAH",
        roomName: roomName.trim(),
        maxUsers: maxUsers,
      });

      // Auto-join the created game
      await joinRoomMutation.mutateAsync({
        roomCode: result.code,
      });

      // Redirect to game room (you can implement this later)
      console.log("Game created:", result);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    try {
      const result = await joinRoomMutation.mutateAsync({
        roomCode: roomCode.trim(),
      });

      // Redirect to game room (you can implement this later)
      console.log("Joined game:", result);
    } catch (error) {
      console.error("Failed to join game:", error);
    }
  };

  const handleJoinRoom = (code: string) => {
    setRoomCode(code);
  };

  const handleSelectRoom = (code: string) => {
    setRoomCode(code);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <LobbyHeader />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Available Rooms */}
            <div className="lg:col-span-2">
              <RoomsList
                rooms={availableRooms}
                isLoading={roomsLoading}
                onJoinRoom={handleJoinRoom}
                onSelectRoom={handleSelectRoom}
              />
            </div>

            {/* Right Column - Actions */}
            <RoomActions
              roomCode={roomCode}
              onRoomCodeChange={setRoomCode}
              roomName={roomName}
              onRoomNameChange={setRoomName}
              maxUsers={maxUsers}
              onMaxUsersChange={setMaxUsers}
              gameType={gameType}
              onGameTypeChange={setGameType}
              onJoinGame={handleJoinGame}
              onCreateGame={handleCreateGame}
              joinRoomMutation={joinRoomMutation}
              createRoomMutation={createRoomMutation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
