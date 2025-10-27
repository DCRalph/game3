"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Spinner } from "../ui/spinner";

export function PlayerNameForm() {
  const utils = api.useUtils();
  const meQuery = api.auth.me.useQuery();
  const signUpMutation = api.auth.signUp.useMutation();
  const signOutMutation = api.auth.signOut.useMutation();

  const [playerName, setPlayerName] = useState("");

  const handleSignIn = async () => {
    if (!playerName.trim()) return;

    try {
      await signUpMutation.mutateAsync({ name: playerName.trim() });
      await utils.auth.me.invalidate();
      setPlayerName("");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      await utils.auth.me.invalidate();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const isLoading = meQuery.isLoading;
  const isAuthenticated = meQuery.data?.session?.userId && meQuery.data?.session?.user;
  const userName = meQuery.data?.session?.user?.name;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Name</CardTitle>
          <CardDescription>
            Loading...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 flex items-center justify-center">
            <Spinner
              className="size-10 animate-spin"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Name</CardTitle>
        <CardDescription>
          {isAuthenticated
            ? "You are signed in and ready to play"
            : "Enter your name to join or create games"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Label>Welcome back!</Label>
              <div className="flex items-center justify-between p-3 rounded-md">
                <span className="font-semibold underline">{userName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signOutMutation.isPending}
                >
                  {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <div className="flex gap-2">
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSignIn();
                    }
                  }}
                />
                <Button
                  onClick={handleSignIn}
                  disabled={!playerName.trim() || signUpMutation.isPending}
                >
                  {signUpMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
