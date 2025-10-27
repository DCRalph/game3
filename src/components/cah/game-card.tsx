"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CheckCircle, Circle } from "lucide-react";
import type { CAHCard, CAHGameCardWithCard } from "~/types/cah";

interface GameCardProps {
  card: CAHGameCardWithCard;
  isSelected?: boolean;
  isSelectable?: boolean;
  isCzar?: boolean;
  isWinner?: boolean;
  onClick?: () => void;
  className?: string;
  showPickCount?: boolean;
}

export function GameCard({
  card,
  isSelected = false,
  isSelectable = false,
  isCzar = false,
  isWinner = false,
  onClick,
  className = "",
  showPickCount = false
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isBlack = card.card.type === 'BLACK';
  const isWhite = card.card.type === 'WHITE';

  const handleClick = () => {
    if (isSelectable && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={isSelectable ? { scale: 1.02, y: -2 } : {}}
      whileTap={isSelectable ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative ${className}`}
    >
      <Card
        className={`
          relative cursor-pointer transition-all duration-200 min-h-[180px] sm:min-h-[200px] w-full
          ${isBlack ? 'bg-black text-white border-gray-800' : 'bg-white text-black border-gray-300'}
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${isWinner ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
          ${isCzar ? 'opacity-50 cursor-not-allowed' : ''}
          ${isSelectable ? 'hover:shadow-lg active:scale-95' : ''}
          ${isHovered && isSelectable ? 'shadow-xl' : ''}
          touch-manipulation
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4 h-full flex flex-col justify-between">
          {/* Card Type Badge */}
          <div className="flex justify-between items-start mb-2">
            <Badge
              variant={isBlack ? "secondary" : "default"}
              className={`
                text-xs
                ${isBlack ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}
              `}
            >
              {isBlack ? 'BLACK' : 'WHITE'}
            </Badge>

            {showPickCount && isBlack && card.card.pick && (
              <Badge variant="outline" className="text-xs">
                Pick {card.card.pick}
              </Badge>
            )}
          </div>

          {/* Card Content */}
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-xs sm:text-sm font-medium leading-relaxed wrap-break-word">
              {card.card.content}
            </p>
          </div>

          {/* Selection Indicator */}
          {isSelectable && (
            <div className="absolute top-2 right-2">
              {isSelected ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          )}

          {/* Winner Badge */}
          {isWinner && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-yellow-500 text-black text-xs">
                Winner!
              </Badge>
            </div>
          )}

          {/* Czar Overlay */}
          {isCzar && (
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                Czar Card
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CardHandProps {
  cards: CAHGameCardWithCard[];
  selectedCards: string[];
  onCardSelect: (cardId: string) => void;
  maxSelection?: number;
  isCzar?: boolean;
  className?: string;
}

export function CardHand({
  cards,
  selectedCards,
  onCardSelect,
  maxSelection = 1,
  isCzar = false,
  className = ""
}: CardHandProps) {
  const handleCardClick = (cardId: string) => {
    if (isCzar) return;

    if (selectedCards.includes(cardId)) {
      onCardSelect(cardId);
    } else if (selectedCards.length < maxSelection) {
      onCardSelect(cardId);
    }
  };

  if (isCzar) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">
          You are the Czar! Wait for other players to submit their cards.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select {maxSelection} card{maxSelection !== 1 ? 's' : ''} to play
        </p>
        {selectedCards.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCards.length} of {maxSelection} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {cards.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            isSelected={selectedCards.includes(card.id)}
            isSelectable={true}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface BlackCardDisplayProps {
  card: CAHCard;
  pickCount: number;
  className?: string;
}

export function BlackCardDisplay({ card, pickCount, className = "" }: BlackCardDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="bg-black text-white border-gray-800 min-h-[300px]">
        <CardContent className="p-6 h-full flex flex-col justify-center text-center">
          <div className="mb-4">
            <Badge className="bg-gray-700 text-white mb-2">
              BLACK CARD
            </Badge>
            {pickCount > 1 && (
              <Badge variant="outline" className="ml-2 text-white border-white">
                Pick {pickCount}
              </Badge>
            )}
          </div>

          <h2 className="text-xl font-bold leading-relaxed">
            {card.content}
          </h2>
        </CardContent>
      </Card>
    </motion.div>
  );
}
