'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PokerCardProps {
  value: string | number;
  onClick: () => void;
  isSelected: boolean;
  disabled: boolean;
}

export function PokerCard({ value, onClick, isSelected, disabled }: PokerCardProps) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size="lg"
      className={cn(
        "h-24 w-16 sm:h-28 sm:w-20 md:h-32 md:w-24 text-2xl md:text-3xl font-bold flex items-center justify-center transition-all duration-150 ease-in-out transform hover:scale-105",
        isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-105 shadow-lg",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`Vote ${value}`}
    >
      {value}
    </Button>
  );
}
