
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Code, Trophy, Swords } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';

const Index = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const handleMatchmaking = () => {
    if (difficulty) {
      navigate(`/battle?difficulty=${difficulty.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-3xl w-full text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Code Arena Duels
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            Battle other coders in real-time competitive programming matches
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Card className="relative w-full md:w-64 bg-card hover:bg-card/80 transition-colors">
              <div className="absolute -top-3 -right-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardHeader>
                <CardTitle>Real-time Battles</CardTitle>
                <CardDescription>Race against opponents to solve coding challenges</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative w-full md:w-64 bg-card hover:bg-card/80 transition-colors">
              <div className="absolute -top-3 -right-3">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <CardHeader>
                <CardTitle>LeetCode Problems</CardTitle>
                <CardDescription>Practice with actual interview questions</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative w-full md:w-64 bg-card hover:bg-card/80 transition-colors">
              <div className="absolute -top-3 -right-3">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CardHeader>
                <CardTitle>Power-Ups</CardTitle>
                <CardDescription>Use strategic abilities to gain advantage</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Find a Match
            </CardTitle>
            <CardDescription>
              Select difficulty and battle another coder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={difficulty === 'Easy' ? 'default' : 'outline'}
                className={difficulty === 'Easy' ? 'border-2 border-primary' : ''}
                onClick={() => setDifficulty('Easy')}
              >
                Easy
              </Button>
              <Button
                variant={difficulty === 'Medium' ? 'default' : 'outline'}
                className={difficulty === 'Medium' ? 'border-2 border-primary' : ''}
                onClick={() => setDifficulty('Medium')}
              >
                Medium
              </Button>
              <Button
                variant={difficulty === 'Hard' ? 'default' : 'outline'}
                className={difficulty === 'Hard' ? 'border-2 border-primary' : ''}
                onClick={() => setDifficulty('Hard')}
              >
                Hard
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={!difficulty}
              onClick={handleMatchmaking}
            >
              Start Matchmaking
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <footer className="py-4 border-t border-border text-center text-sm text-muted-foreground">
        Code Arena Duels &copy; {new Date().getFullYear()} - Competitive Coding Platform
      </footer>
    </div>
  );
};

export default Index;
