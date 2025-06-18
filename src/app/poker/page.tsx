'use client';

import { AdminControls } from '@/components/poker/admin-controls';
import { ParticipantsList } from '@/components/poker/participants-list';
import { ResultsDisplay } from '@/components/poker/results-display';
import { VotingArea } from '@/components/poker/voting-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { usePokerSession } from '@/contexts/poker-session-context';
import { UserRole } from '@/lib/types';
import { Info } from 'lucide-react';

export default function PokerRoomPage() {
  const { user } = useAuth();
  const { storyName, votingOpen, votesRevealed } = usePokerSession();

  const CurrentStoryDisplay = () => {
    if (!storyName) {
      return (
        <Card className="mb-6 text-center bg-muted/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline">No Active Story</CardTitle>
            <CardDescription>The admin needs to start a new story to begin voting.</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    return (
      <Card className="mb-6 text-center shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Current Story</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-primary">{storyName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {votingOpen && !votesRevealed && "Voting is open."}
            {!votingOpen && votesRevealed && "Voting is closed. Results are shown."}
            {!votingOpen && !votesRevealed && "Waiting for admin to start or reveal votes."}
          </p>
        </CardContent>
      </Card>
    );
  };
  
  const ObserverMessage = () => {
    if (user?.role === UserRole.OBSERVER) {
      return (
        <Card className="mt-8 text-center border-primary bg-primary/10">
          <CardHeader className="flex flex-row items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-headline text-primary">Observer Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">You are observing this session. You can see participants and revealed results, but cannot vote.</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4 h-full">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]"> {/* Adjusted height calculation */}
        <aside className="w-full lg:w-1/3 xl:w-1/4 lg:h-full">
          <ParticipantsList />
        </aside>
        <section className="w-full lg:w-2/3 xl:w-3/4 lg:h-full flex flex-col overflow-y-auto px-1 sm:px-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
          {user?.role === UserRole.ADMIN && <AdminControls />}
          <CurrentStoryDisplay />
          
          {user?.role === UserRole.VOTER && votingOpen && !votesRevealed && <VotingArea />}
          
          {(votesRevealed || (user?.role === UserRole.ADMIN && !votingOpen)) && <ResultsDisplay />}

          {user?.role === UserRole.OBSERVER && <ObserverMessage />}
          
          {user?.role === UserRole.VOTER && !votingOpen && !votesRevealed && (
             <Card className="mt-8 text-center shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Waiting...</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg">
                    {storyName ? `Waiting for admin to start voting or reveal results for "${storyName}".` : "Waiting for admin to start a new story."}
                  </p>
                </CardContent>
              </Card>
          )}
        </section>
      </div>
    </div>
  );
}
