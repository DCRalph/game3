"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Users, Calendar, Gamepad2, Settings, Clock, CheckCircle, User } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import Link from "next/link";

interface RoomCardProps {
  room: RouterOutputs["room"]["getAvailableRooms"][number];
  onJoin: (roomCode: string) => void;
  onSelect: (roomCode: string) => void;
}

const gameTypeMap = {
  CAH: "Cards Against Humanity",
}

const statusConfig = {
  SETUP: {
    label: "Setup",
    icon: Settings,
    variant: "secondary" as const,
    color: "text-yellow-600",
  },
  WAITING_FOR_PLAYERS: {
    label: "Waiting",
    icon: Clock,
    variant: "default" as const,
    color: "text-blue-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Gamepad2,
    variant: "destructive" as const,
    color: "text-red-600",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    variant: "outline" as const,
    color: "text-green-600",
  },
}

export function RoomCard({ room, onJoin, onSelect }: RoomCardProps) {
  const meQuery = api.auth.me.useQuery();

  const isFull = room.maxUsers ? room._count.users >= room.maxUsers : false;
  const gameTypeDisplay = gameTypeMap[room.gameType as keyof typeof gameTypeMap] ?? room.gameType;
  const statusInfo = statusConfig[room.status as keyof typeof statusConfig];
  const StatusIcon = statusInfo?.icon || Settings;
  const inRoom = room.users.some(user => user.id === meQuery.data?.session?.userId);
  const canJoin = room.status === "WAITING_FOR_PLAYERS" && !isFull && !inRoom;
  const isCreator = room.creator?.id === meQuery.data?.session?.userId;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${!canJoin && !inRoom ? "opacity-60" : "hover:scale-[1.02]"
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
              {statusInfo && (
                <Badge variant={statusInfo.variant} className={`text-xs ${statusInfo.color}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFull && (
              <Badge variant="destructive" className="text-xs">
                Full
              </Badge>
            )}
            {room.status === "IN_PROGRESS" && (
              <Badge variant="destructive" className="text-xs">
                In Progress
              </Badge>
            )}
          </div>
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
              <User className="w-4 h-4" />
              <span>
                {room.creator?.name ?? "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(room.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {inRoom ? (
            <Link href="/game">
              <Button
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="ml-2"
              >
                Open
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onJoin(room.code);
              }}
              disabled={!canJoin}
              className="ml-2"
            >
              {!canJoin
                ? room.status === "IN_PROGRESS"
                  ? "In Progress"
                  : room.status === "SETUP"
                    ? "Setup"
                    : "Full"
                : "Join"
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
