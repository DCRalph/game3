"use client";

import { api } from "~/trpc/react";

export default function GamePage() {

  const meQuery = api.auth.me.useQuery();
  const currentRoomQuery = api.room.getCurrentRoom.useQuery();

  return (
    <div>
      <h1>Game Page</h1>
      <pre>{JSON.stringify(meQuery.data, null, 2)}</pre>
      <pre className="text-red-500">{JSON.stringify(meQuery.error, null, 2)}</pre>
      <pre>{JSON.stringify(currentRoomQuery.data, null, 2)}</pre>
      <pre className="text-red-500">{JSON.stringify(currentRoomQuery.error, null, 2)}</pre>
    </div>
  );
}