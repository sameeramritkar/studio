'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePokerSession } from '@/contexts/poker-session-context';
import { POKER_VALUES, UserRole } from '@/lib/types';
import { PokerCard } from './poker-card';

export function VotingArea() {
  const { user } = useAuth();
  const { castVote, votingOpen, votesRevealed, getParticipantVote } = usePokerSession();

  if (!user || user.role !== UserRole.VOTER || !votingOpen || votesRevealed) {
    return null; 
  }

  const selectedVote = getParticipantVote(user.id);

  const handleVote = (value: string | number) => {
    if (user) {
      castVote(user.id, value);
    }
  };

  return (
    <div className="my-8">
      <h2 className="mb-6 text-center text-xl font-semibold text-foreground">Cast Your Vote</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 justify-items-center max-w-2xl mx-auto">
        {POKER_VALUES.map((value) => (
          <PokerCard
            key={value}
            value={value}
            onClick={() => handleVote(value)}
            isSelected={selectedVote === value}
            disabled={!votingOpen || votesRevealed}
          />
        ))}
      </div>
    </div>
  );
}
