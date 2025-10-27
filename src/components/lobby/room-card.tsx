"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Users, Calendar, Gamepad2 } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

interface RoomCardProps {
  room: RouterOutputs["room"]["getAvailableRooms"][number];
  onJoin: (roomCode: string) => void;
  onSelect: (roomCode: string) => void;
}

const gameTypeMap = {
  CAH: "Cards Against Humanity",
}

export function RoomCard({ room, onJoin, onSelect }: RoomCardProps) {
  const isFull = room.maxUsers ? room._count.users >= room.maxUsers : false;
  const gameTypeDisplay = gameTypeMap[room.gameType as keyof typeof gameTypeMap] ?? room.gameType;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isFull ? "opacity-60" : "hover:scale-[1.02]"
        }`}
      onClick={() => onSelect(room.code)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {room.name ?? `Room ${room.code}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {room.code}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Gamepad2 className="w-3 h-3 mr-1" />
                {gameTypeDisplay}
              </Badge>
            </div>
          </div>
          {isFull && (
            <Badge variant="destructive" className="text-xs">
              Full
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {room._count.users} / {room.maxUsers ?? "∞"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(room.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onJoin(room.code);
            }}
            disabled={isFull}
            className="ml-2"
          >
            {isFull ? "Full" : "Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
