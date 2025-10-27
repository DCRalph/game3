"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Navigation from "../_components/navigation";

export default function LobbyPage() {
  const [mode, setMode] = useState<"join" | "create">("join");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [gameName, setGameName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [winningScore, setWinningScore] = useState(5);

  const { data: availableGames, isLoading: gamesLoading, refetch: refetchGames } = api.game.getAvailableGames.useQuery();
  const createGameMutation = api.game.createGame.useMutation();
  const joinGameMutation = api.game.joinGame.useMutation();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) return;

    try {
      const result = await createGameMutation.mutateAsync({
        gameType: "CAH",
        gameName: gameName.trim(),
        maxPlayers,
        winningScore,
        allowPlayerJoinsAfterStart: false,
      });

      // Auto-join the created game
      if (playerName.trim()) {
        await joinGameMutation.mutateAsync({
          roomCode: result.code,
          playerName: playerName.trim(),
        });
      }

      // Redirect to game room (you can implement this later)
      console.log("Game created:", result);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    try {
      const result = await joinGameMutation.mutateAsync({
        roomCode: roomCode.trim(),
        playerName: playerName.trim(),
      });

      // Redirect to game room (you can implement this later)
      console.log("Joined game:", result);
    } catch (error) {
      console.error("Failed to join game:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Game Lobby</h1>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setMode("join")}
                className={`px-6 py-2 rounded-md transition-all ${mode === "join"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white"
                  }`}
              >
                Join Game
              </button>
              <button
                onClick={() => setMode("create")}
                className={`px-6 py-2 rounded-md transition-all ${mode === "create"
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white"
                  }`}
              >
                Create Game
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Join Game Section */}
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Join a Game</h2>

              <form onSubmit={handleJoinGame} className="space-y-4">
                <div>
                  <label htmlFor="playerName" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="roomCode" className="block text-sm font-medium mb-2">
                    Room Code
                  </label>
                  <input
                    id="roomCode"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter room code"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={joinGameMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {joinGameMutation.isPending ? "Joining..." : "Join Game"}
                </button>
              </form>
            </div>

            {/* Create Game Section */}
            <div className="bg-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Create a Game</h2>

              <form onSubmit={handleCreateGame} className="space-y-4">
                <div>
                  <label htmlFor="createPlayerName" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    id="createPlayerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="gameName" className="block text-sm font-medium mb-2">
                    Game Name
                  </label>
                  <input
                    id="gameName"
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter game name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="maxPlayers" className="block text-sm font-medium mb-2">
                      Max Players
                    </label>
                    <input
                      id="maxPlayers"
                      type="number"
                      min="2"
                      max="20"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="winningScore" className="block text-sm font-medium mb-2">
                      Winning Score
                    </label>
                    <input
                      id="winningScore"
                      type="number"
                      min="1"
                      max="100"
                      value={winningScore}
                      onChange={(e) => setWinningScore(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createGameMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {createGameMutation.isPending ? "Creating..." : "Create Game"}
                </button>
              </form>
            </div>
          </div>

          {/* Available Games List */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Available Games</h2>
            <div className="bg-white/10 rounded-lg p-6">
              {gamesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2 text-white/70">Loading games...</p>
                </div>
              ) : availableGames && availableGames.length > 0 ? (
                <div className="space-y-3">
                  {availableGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors cursor-pointer"
                      onClick={() => setRoomCode(game.code)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{game.gameName}</h3>
                          <p className="text-white/70">Room Code: {game.code}</p>
                          <p className="text-white/70">
                            {game.playerCount} / {game.maxPlayers ?? "∞"} players
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white/70">
                            {game.gameType === "CAH" ? "Cards Against Humanity" : game.gameType}
                          </p>
                          <p className="text-xs text-white/50">
                            {new Date(game.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70">No games available. Create one to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
