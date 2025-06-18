'use client';

import type { Participant, User, UserRole } from '@/lib/types';
import { POKER_VALUES } from '@/lib/types';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';

interface PokerSessionState {
  participants: Participant[];
  storyName: string | null;
  votingOpen: boolean;
  votesRevealed: boolean;
  averageVote: number | null;
  voteCounts: Record<string | number, number>;
}

interface PokerSessionContextType extends PokerSessionState {
  setParticipants: Dispatch<SetStateAction<Participant[]>>;
  setStoryName: Dispatch<SetStateAction<string | null>>;
  setVotingOpen: Dispatch<SetStateAction<boolean>>;
  setVotesRevealed: Dispatch<SetStateAction<boolean>>;
  
  addParticipant: (user: User) => void;
  removeParticipant: (userId: string) => void;
  castVote: (userId: string, vote: string | number) => void;
  startNewStory: (newStoryName: string) => void;
  revealVotesAction: () => void;
  resetRound: () => void;
  getParticipantVote: (userId: string) => string | number | undefined;
}

const PokerSessionContext = createContext<PokerSessionContextType | undefined>(undefined);

const initialPokerSessionState: PokerSessionState = {
  participants: [],
  storyName: null,
  votingOpen: false,
  votesRevealed: false,
  averageVote: null,
  voteCounts: {},
};

function calculateResults(participants: Participant[]): Pick<PokerSessionState, 'averageVote' | 'voteCounts'> {
  const voteCounts: Record<string | number, number> = {};
  let sum = 0;
  let numericVoteCount = 0;

  participants.forEach(p => {
    if (p.hasVoted && p.vote !== undefined) {
      voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
      const numericVote = Number(p.vote);
      if (!isNaN(numericVote)) {
        sum += numericVote;
        numericVoteCount++;
      }
    }
  });
  const averageVote = numericVoteCount > 0 ? parseFloat((sum / numericVoteCount).toFixed(1)) : null;
  return { averageVote, voteCounts };
}


export const PokerSessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionState, setSessionState] = useState<PokerSessionState>(initialPokerSessionState);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('pokerSessionState');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
         // Ensure all fields are present, merge with defaults if not
        setSessionState(prevState => ({...prevState, ...parsedSession}));
      }
    } catch (error) {
      console.error("Failed to parse session state from localStorage", error);
      localStorage.removeItem('pokerSessionState');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pokerSessionState', JSON.stringify(sessionState));
  }, [sessionState]);

  const setParticipants: Dispatch<SetStateAction<Participant[]>> = (updater) => {
    setSessionState(prev => ({ ...prev, participants: typeof updater === 'function' ? updater(prev.participants) : updater }));
  };
  const setStoryName: Dispatch<SetStateAction<string | null>> = (updater) => {
    setSessionState(prev => ({ ...prev, storyName: typeof updater === 'function' ? updater(prev.storyName) : updater }));
  };
  const setVotingOpen: Dispatch<SetStateAction<boolean>> = (updater) => {
    setSessionState(prev => ({ ...prev, votingOpen: typeof updater === 'function' ? updater(prev.votingOpen) : updater }));
  };
  const setVotesRevealed: Dispatch<SetStateAction<boolean>> = (updater) => {
    setSessionState(prev => ({ ...prev, votesRevealed: typeof updater === 'function' ? updater(prev.votesRevealed) : updater }));
  };


  const addParticipant = useCallback((userToAdd: User) => {
    setSessionState(prev => {
      if (prev.participants.find(p => p.id === userToAdd.id)) return prev; // Already exists
      const newParticipant: Participant = { ...userToAdd, hasVoted: false };
      return { ...prev, participants: [...prev.participants, newParticipant] };
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    setSessionState(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== userId) }));
  }, []);

  const castVote = useCallback((userId: string, vote: string | number) => {
    setSessionState(prev => {
      if (!prev.votingOpen || prev.votesRevealed) return prev; // Can only vote if open and not revealed
      return {
        ...prev,
        participants: prev.participants.map(p =>
          p.id === userId ? { ...p, vote, hasVoted: true } : p
        )
      };
    });
  }, []);
  
  const getParticipantVote = useCallback((userId: string): string | number | undefined => {
    const participant = sessionState.participants.find(p => p.id === userId);
    return participant?.vote;
  }, [sessionState.participants]);

  const startNewStory = useCallback((newStoryName: string) => {
    setSessionState(prev => ({
      ...prev,
      storyName: newStoryName,
      votingOpen: true,
      votesRevealed: false,
      averageVote: null,
      voteCounts: {},
      participants: prev.participants.map(p => ({ ...p, vote: undefined, hasVoted: false })),
    }));
  }, []);

  const revealVotesAction = useCallback(() => {
    setSessionState(prev => {
      if (!prev.votingOpen && prev.votesRevealed) return prev; // Already revealed or was never open
      const results = calculateResults(prev.participants);
      return {
        ...prev,
        votingOpen: false,
        votesRevealed: true,
        averageVote: results.averageVote,
        voteCounts: results.voteCounts,
      };
    });
  }, []);

  const resetRound = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      votingOpen: true,
      votesRevealed: false,
      averageVote: null,
      voteCounts: {},
      participants: prev.participants.map(p => ({ ...p, vote: undefined, hasVoted: false })),
    }));
  }, []);

  useEffect(() => {
    if (currentUser) {
      addParticipant(currentUser);
    }
    // This effect should run when currentUser changes, typically on login.
    // No cleanup needed for removeParticipant here as logout handles it.
  }, [currentUser, addParticipant]);

  return (
    <PokerSessionContext.Provider value={{ 
      ...sessionState,
      setParticipants,
      setStoryName,
      setVotingOpen,
      setVotesRevealed,
      addParticipant, 
      removeParticipant, 
      castVote,
      startNewStory,
      revealVotesAction,
      resetRound,
      getParticipantVote,
    }}>
      {children}
    </PokerSessionContext.Provider>
  );
};

export const usePokerSession = () => {
  const context = useContext(PokerSessionContext);
  if (context === undefined) {
    throw new Error('usePokerSession must be used within a PokerSessionProvider');
  }
  return context;
};
