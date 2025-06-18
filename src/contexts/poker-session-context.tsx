
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
      const storedSessionJson = localStorage.getItem('pokerSessionState');
      if (storedSessionJson) {
        const parsedSession = JSON.parse(storedSessionJson);
        // Merge stored session with initial state.
        // This ensures all keys from initialPokerSessionState are present,
        // and values from parsedSession override them if they exist.
        setSessionState({ ...initialPokerSessionState, ...parsedSession });
      } else {
        // No stored session, so state remains initialPokerSessionState
        setSessionState(initialPokerSessionState);
      }
    } catch (error) {
      console.error("Failed to parse or load session state from localStorage", error);
      localStorage.removeItem('pokerSessionState'); 
      setSessionState(initialPokerSessionState); 
    }
  }, []); 

  useEffect(() => {
    localStorage.setItem('pokerSessionState', JSON.stringify(sessionState));
  }, [sessionState]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pokerSessionState') {
        if (event.newValue) { 
          try {
            const updatedState = JSON.parse(event.newValue);
            // Merge with initial state to ensure all keys are present, similar to initial load
            setSessionState(prev => ({ ...initialPokerSessionState, ...updatedState })); 
          } catch (error) {
            console.error("Failed to parse updated session state from storage event", error);
          }
        } else { 
          setSessionState(initialPokerSessionState); 
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


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
      if (prev.participants.find(p => p.id === userToAdd.id)) return prev; 
      const newParticipant: Participant = { ...userToAdd, hasVoted: false };
      return { ...prev, participants: [...prev.participants, newParticipant] };
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    setSessionState(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== userId) }));
  }, []);

  const castVote = useCallback((userId: string, vote: string | number) => {
    setSessionState(prev => {
      if (!prev.votingOpen || prev.votesRevealed) return prev; 
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
    setSessionState(prev => {
      const updatedParticipants = prev.participants.map(p => ({ ...p, vote: undefined, hasVoted: false }));
      return {
        ...initialPokerSessionState, 
        participants: updatedParticipants, 
        storyName: newStoryName, 
        votingOpen: true, 
      };
    });
  }, []);

  const revealVotesAction = useCallback(() => {
    setSessionState(prev => {
      if (!prev.storyName && !prev.votingOpen && prev.votesRevealed) return prev; 
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

