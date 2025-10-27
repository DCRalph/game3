import { Gamepad2 } from "lucide-react";

export function LobbyHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Gamepad2 className="w-8 h-8 text-purple-400" />
        <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Game Lobby
        </h1>
      </div>
      <p className="text-zinc-300 text-lg">
        Join an existing room or create your own game
      </p>
    </div>
  );
}
