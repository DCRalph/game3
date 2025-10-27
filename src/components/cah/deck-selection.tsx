"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { CheckCircle, Circle, Square, Users } from "lucide-react";
import type { CAHDeckInfo } from "~/types/cah";

interface DeckSelectionProps {
  decks: CAHDeckInfo[];
  selectedDecks: string[];
  onSelectionChange: (deckIds: string[]) => void;
  onNext: () => void;
  disabled?: boolean;
}

export function DeckSelection({
  decks,
  selectedDecks,
  onSelectionChange,
  onNext,
  disabled = false
}: DeckSelectionProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedDecks);

  const handleDeckToggle = (deckId: string) => {
    const newSelection = localSelection.includes(deckId)
      ? localSelection.filter(id => id !== deckId)
      : [...localSelection, deckId];

    setLocalSelection(newSelection);
    onSelectionChange(newSelection);
  };

  const totalWhiteCards = decks
    .filter(deck => localSelection.includes(deck.id))
    .reduce((sum, deck) => sum + deck.whiteCount, 0);

  const totalBlackCards = decks
    .filter(deck => localSelection.includes(deck.id))
    .reduce((sum, deck) => sum + deck.blackCount, 0);

  const canProceed = localSelection.length > 0 && totalWhiteCards > 0 && totalBlackCards > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Select Card Decks</h2>
        <p className="text-muted-foreground">
          Choose which card decks to include in your game
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deck Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="w-5 h-5" />
                Available Decks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {decks.map((deck) => {
                    const isSelected = localSelection.includes(deck.id);
                    return (
                      <motion.div
                        key={deck.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleDeckToggle(deck.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleDeckToggle(deck.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{deck.name}</h3>
                            <div className="flex gap-2 ml-2">
                              <Badge variant="secondary" className="text-xs">
                                {deck.whiteCount} white
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {deck.blackCount} black
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {deck.totalCards} total cards
                          </p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Selection Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Selection Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Selected Decks:</span>
                  <Badge variant="secondary">{localSelection.length}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">White Cards:</span>
                  <Badge variant="outline">{totalWhiteCards}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Black Cards:</span>
                  <Badge variant="outline">{totalBlackCards}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Cards:</span>
                  <Badge variant="default">{totalWhiteCards + totalBlackCards}</Badge>
                </div>
              </div>

              {localSelection.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Decks:</p>
                  <div className="space-y-1">
                    {decks
                      .filter(deck => localSelection.includes(deck.id))
                      .map(deck => (
                        <div key={deck.id} className="text-xs text-muted-foreground">
                          • {deck.name}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <Button
                onClick={onNext}
                disabled={!canProceed || disabled}
                className="w-full"
                size="lg"
              >
                Continue to Game Settings
              </Button>

              {!canProceed && localSelection.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Select at least one deck to continue
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
