import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import { Trophy, Medal, User, Search, Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';

// Sample player names for generation
const playerNamePrefixes = ['Code', 'Algo', 'Byte', 'Data', 'Logic', 'Syntax', 'Binary', 'Function', 'Query', 'Hash'];
const playerNameSuffixes = ['Master', 'Ninja', 'Warrior', 'Dragon', 'Slayer', 'Baron', 'Legend', 'Fury', 'Knight', 'Sage'];

// Generate a random player
const generatePlayer = (rank: number, previousRating?: number) => {
  const prefix = playerNamePrefixes[Math.floor(Math.random() * playerNamePrefixes.length)];
  const suffix = playerNameSuffixes[Math.floor(Math.random() * playerNameSuffixes.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  const name = `${prefix}${suffix}${randomNumber}`;
  
  const rating = previousRating ? previousRating - Math.floor(Math.random() * 50 + 1) : 2500 - (rank * 15);
  const tier = rating >= 2200 ? 'Diamond' : 
               rating >= 2000 ? 'Platinum' :
               rating >= 1700 ? 'Gold' :
               rating >= 1400 ? 'Silver' : 'Bronze';
  
  const totalGames = 100 + Math.floor(Math.random() * 150);
  const winRate = Math.max(90 - (rank * 0.5), 45) + (Math.random() * 10 - 5);
  const wins = Math.floor(totalGames * (winRate / 100));
  const losses = totalGames - wins;

  return {
    rank,
    name,
    wins,
    losses,
    winRate: Number((wins / totalGames * 100).toFixed(1)),
    tier,
    rating
  };
};

// Initial leaderboard data
const initialLeaderboardData = Array.from({ length: 10 }, (_, i) => {
  const player = generatePlayer(i + 1);
  return player;
});

const getTierColor = (tier) => {
  switch (tier) {
    case 'Diamond': return 'text-cyan-400';
    case 'Platinum': return 'text-purple-400';
    case 'Gold': return 'text-amber-400';
    case 'Silver': return 'text-gray-400';
    case 'Bronze': return 'text-amber-700';
    default: return 'text-gray-500';
  }
};

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-muted-foreground">{rank}</span>;
};

const Leaderboard = () => {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData);
  const [isLoading, setIsLoading] = useState(false);
  
  const filteredData = leaderboardData.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentLength = leaderboardData.length;
      const lastRating = leaderboardData[currentLength - 1]?.rating;
      const newPlayers = Array.from({ length: 10 }, (_, i) => 
        generatePlayer(currentLength + i + 1, lastRating)
      );
      setLeaderboardData([...leaderboardData, ...newPlayers]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      
      <main className="flex-grow container py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground">Top ranked coders</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players..."
                className="pl-9 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isPremium && (
              <Badge variant="default" className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm">
                {isAdmin ? (
                  <>
                    <Shield className="h-5 w-5 mr-1.5" />
                    Admin Access
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-1" />
                    Premium Active
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">W/L</TableHead>
                <TableHead className="text-right">Win %</TableHead>
                <TableHead className="text-right">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((player) => (
                <TableRow key={player.rank}>
                  <TableCell className="font-medium">
                    <div className="flex justify-center items-center">
                      {getRankIcon(player.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span>{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {player.rating}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-primary">{player.wins}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">{player.losses}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {player.winRate}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="outline" 
                      className={`font-semibold ${getTierColor(player.tier)}`}
                    >
                      {player.tier}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      </main>
      
      <footer className="py-4 border-t text-center text-sm text-muted-foreground">
        Code Arena Duels &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Leaderboard;
