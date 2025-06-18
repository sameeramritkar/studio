'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { usePokerSession } from '@/contexts/poker-session-context';
import type { Participant } from '@/lib/types';
import { UserRole } from '@/lib/types';
import { CheckCircle2, CircleDashed, Eye, HelpCircle, UserCheck, UserCog, UserIcon } from 'lucide-react';
import React from 'react';

const RoleIcon = ({ role }: { role: UserRole }) => {
  switch (role) {
    case UserRole.ADMIN:
      return <UserCog className="h-4 w-4 text-primary" aria-label="Admin" />;
    case UserRole.VOTER:
      return <UserCheck className="h-4 w-4 text-green-500" aria-label="Voter" />;
    case UserRole.OBSERVER:
      return <Eye className="h-4 w-4 text-blue-500" aria-label="Observer" />;
    default:
      return <UserIcon className="h-4 w-4 text-muted-foreground" />;
  }
};

const VotingStatusIcon = ({ participant, isAdminView, votesRevealed }: { participant: Participant, isAdminView: boolean, votesRevealed: boolean }) => {
  if (participant.role === UserRole.ADMIN || participant.role === UserRole.OBSERVER) {
    return <span className="text-xs text-muted-foreground italic">{participant.role === UserRole.ADMIN ? 'Admin' : 'Observing'}</span>;
  }

  if (votesRevealed) {
    return (
      <Badge variant="secondary" className="px-2 py-1 text-sm font-semibold">
        {participant.vote ?? <HelpCircle className="h-4 w-4 inline-block" />}
      </Badge>
    );
  }

  if (participant.hasVoted) {
    if (isAdminView) {
      return <Badge variant="outline" className="px-2 py-1 text-xs">Voted</Badge>; // Admin sees they voted, but not the value yet
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Voted" />;
  }
  
  return <CircleDashed className="h-5 w-5 text-muted-foreground animate-pulse" aria-label="Pending vote" />;
};


export function ParticipantsList() {
  const { user: currentUser } = useAuth();
  const { participants, votesRevealed } = usePokerSession();

  if (!currentUser) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-primary" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)] pr-3"> {/* Adjusted height */}
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No participants yet.</p>
          ) : (
            <ul className="space-y-3">
              {participants.map((participant) => (
                <li
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-md bg-card hover:bg-muted/50 transition-colors"
                  aria-label={`Participant: ${participant.username}, Role: ${participant.role}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage src={`https://placehold.co/40x40/79B4B7/213938?text=${participant.username.substring(0, 1).toUpperCase()}`} alt={participant.username} data-ai-hint="avatar initial"/>
                      <AvatarFallback>{participant.username.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px]">{participant.username}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RoleIcon role={participant.role} />
                        <span className="capitalize">{participant.role.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[70px] text-right">
                    <VotingStatusIcon participant={participant} isAdminView={currentUser.role === UserRole.ADMIN} votesRevealed={votesRevealed} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
