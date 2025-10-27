"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { RoomCard } from "~/components/lobby/room-card";
import { Users, AlertCircle } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";

interface RoomsListProps {
  rooms: RouterOutputs["room"]["getAvailableRooms"] | undefined;
  isLoading: boolean;
  onJoinRoom: (roomCode: string) => void;
  onSelectRoom: (roomCode: string) => void;
}

export function RoomsList({ rooms, isLoading, onJoinRoom, onSelectRoom }: RoomsListProps) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Available Rooms
        </CardTitle>
        <CardDescription>
          Click on a room to join or use the join form
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={onJoinRoom}
                onSelect={onSelectRoom}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">No rooms available</h3>
            <p className="text-zinc-400">Create a new room to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
