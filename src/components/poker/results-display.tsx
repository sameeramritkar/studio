'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePokerSession } from '@/contexts/poker-session-context';
import { POKER_VALUES } from '@/lib/types';
import { CheckSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string | number;
  votes: number;
}

export function ResultsDisplay() {
  const { votesRevealed, voteCounts, averageVote, storyName, participants, votingOpen } = usePokerSession();

  if (!votesRevealed) {
    if (votingOpen) {
       return (
        <Card className="mt-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Voting in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg">Votes will be shown here once the admin reveals them.</p>
            <div className="mt-4 text-sm">
              {participants.filter(p => p.hasVoted).length} / {participants.filter(p => p.role === 'VOTER').length} voters have cast their vote.
            </div>
          </CardContent>
        </Card>
      );
    }
     return (
        <Card className="mt-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Ready to Vote?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg">
              {storyName ? `Waiting for admin to start or reveal votes for "${storyName}".` : "Waiting for admin to start a new story."}
            </p>
          </CardContent>
        </Card>
      );
  }
  
  const chartData: ChartData[] = POKER_VALUES.map(value => ({
    name: value,
    votes: voteCounts[value] || 0,
  })).filter(item => item.votes > 0); // Only show bars for values that received votes

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="mt-8 shadow-xl w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
             <BarChart3 className="h-8 w-8 text-primary" />
            Voting Results
          </CardTitle>
          {averageVote !== null && (
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Average Vote</p>
                <p className="text-3xl font-bold text-accent">{averageVote}</p>
              </div>
          )}
        </div>
        {storyName && <CardDescription className="text-lg">Results for: <span className="font-semibold text-primary">{storyName}</span></CardDescription>}
      </CardHeader>
      <CardContent>
        {totalVotes > 0 ? (
          <>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                  <RechartsTooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(voteCounts)
                .sort(([valA], [valB]) => {
                    const numA = parseFloat(String(valA));
                    const numB = parseFloat(String(valB));
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    if (!isNaN(numA)) return -1; // numbers first
                    if (!isNaN(numB)) return 1;
                    return String(valA).localeCompare(String(valB)); // then strings
                })
                .map(([value, count]) => (
                <div key={value} className="p-3 bg-card rounded-lg border border-border flex flex-col items-center justify-center text-center shadow">
                  <span className="text-3xl font-bold text-primary">{value}</span>
                  <span className={cn("text-sm font-medium", count > 1 ? "text-foreground" : "text-muted-foreground")}>
                    {count} vote{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-lg">No votes were cast for this story.</p>
        )}
      </CardContent>
    </Card>
  );
}
