'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { usePokerSession } from '@/contexts/poker-session-context';
import { UserRole } from '@/lib/types';
import { Play, Eye, RotateCcw, PlusSquare, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const storySchema = z.object({
  storyName: z.string().min(1, { message: 'Story name cannot be empty.' }).max(100, { message: 'Story name too long.'}),
});

type StoryFormValues = z.infer<typeof storySchema>;

export function AdminControls() {
  const { user } = useAuth();
  const { startNewStory, revealVotesAction, resetRound, votingOpen, votesRevealed, storyName: currentStoryName } = usePokerSession();
  const { toast } = useToast();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      storyName: '',
    },
  });

  if (user?.role !== UserRole.ADMIN) {
    return null;
  }

  function handleStartNewStory(values: StoryFormValues) {
    startNewStory(values.storyName);
    toast({ title: "New Story Started", description: `Voting for "${values.storyName}" is now open.` });
    form.reset({ storyName: '' }); // Clear input after starting
  }

  const handleRevealVotes = () => {
    if (!currentStoryName) {
      toast({ variant: "destructive", title: "Error", description: "Please start a story first." });
      return;
    }
    if (!votingOpen && votesRevealed) {
       toast({ title: "Votes Already Revealed", description: "Votes for this round are already visible." });
       return;
    }
     if (votingOpen && !votesRevealed) {
       revealVotesAction();
       toast({ title: "Votes Revealed!", description: `Results for "${currentStoryName}" are now visible.` });
       return;
    }
    toast({ variant: "destructive", title: "Cannot Reveal", description: "Voting is not open or votes already revealed."});
  };

  const handleResetRound = () => {
    if (!currentStoryName) {
      toast({ variant: "destructive", title: "Error", description: "No active story to reset." });
      return;
    }
    resetRound();
    toast({ title: "Round Reset", description: `Voting for "${currentStoryName}" has been reset.` });
  };

  return (
    <Card className="my-6 shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2">
          <Settings2 className="h-7 w-7 text-primary" />
          Admin Controls
        </CardTitle>
        <CardDescription>Manage the pointing poker session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleStartNewStory)} className="space-y-4">
            <FormField
              control={form.control}
              name="storyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Name / Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter story name or ID (e.g., US-123)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <PlusSquare className="mr-2 h-4 w-4" /> Start New Story / Open Voting
            </Button>
          </form>
        </Form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <Button
            onClick={handleRevealVotes}
            disabled={!currentStoryName || (!votingOpen && votesRevealed)}
            variant="outline"
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" /> Reveal Votes
          </Button>
          <Button
            onClick={handleResetRound}
            disabled={!currentStoryName || votingOpen}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Current Round
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
