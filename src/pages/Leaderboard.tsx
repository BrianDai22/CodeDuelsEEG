import { useState } from 'react';
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
import { Trophy, Medal, User, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardDescription } from '@/components/ui/card';

// Sample player names for generation
const playerNamePrefixes = ['Code', 'Algo', 'Byte', 'Data', 'Logic', 'Syntax', 'Binary', 'Function', 'Query', 'Hash'];
const playerNameSuffixes = ['Master', 'Ninja', 'Warrior', 'Dragon', 'Slayer', 'Baron', 'Legend', 'Fury', 'Knight', 'Sage'];

// Tiers and their rating ranges
const tiers = [
  { name: 'Diamond', minRating: 2200 },
  { name: 'Platinum', minRating: 2000 },
  { name: 'Gold', minRating: 1700 },
  { name: 'Silver', minRating: 1400 },
  { name: 'Bronze', minRating: 0 }
];

// Generate a random player
const generatePlayer = (rank: number, previousRating?: number, previousTier?: string) => {
  const prefix = playerNamePrefixes[Math.floor(Math.random() * playerNamePrefixes.length)];
  const suffix = playerNameSuffixes[Math.floor(Math.random() * playerNameSuffixes.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  const name = `${prefix}${suffix}${randomNumber}`;
  
  // Rating decreases as rank increases, with some randomness
  // If there's a previous rating, ensure this player's rating is lower
  const maxRating = previousRating ? previousRating - 1 : Math.max(2500 - (rank * 15), 1400);
  const minRating = Math.max(1400, maxRating - 50); // Ensure at least 50 points below previous player
  const rating = Math.floor(Math.random() * (maxRating - minRating + 1)) + minRating;
  
  // Calculate tier based on rating and previous tier
  let tier = tiers.find(t => rating >= t.minRating)?.name || 'Bronze';
  
  // If there's a previous tier, ensure this player's tier is equal to or less than it
  if (previousTier) {
    const previousTierIndex = tiers.findIndex(t => t.name === previousTier);
    const currentTierIndex = tiers.findIndex(t => t.name === tier);
    if (currentTierIndex < previousTierIndex) {
      // If current tier is higher than previous tier, adjust it down
      tier = previousTier;
    }
  }
  
  // Generate realistic win/loss numbers
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
let previousRating: number | undefined;
let previousTier: string | undefined;
const initialLeaderboardData = Array.from({ length: 10 }, (_, i) => {
  const player = generatePlayer(i + 1, previousRating, previousTier);
  previousRating = player.rating;
  previousTier = player.tier;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData);
  const [isLoading, setIsLoading] = useState(false);
  
  const filteredData = leaderboardData.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoadMore = () => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const currentLength = leaderboardData.length;
      let previousRating = leaderboardData[currentLength - 1]?.rating;
      let previousTier = leaderboardData[currentLength - 1]?.tier;
      
      const newPlayers = Array.from({ length: 10 }, (_, i) => {
        const player = generatePlayer(currentLength + i + 1, previousRating, previousTier);
        previousRating = player.rating;
        previousTier = player.tier;
        return player;
      });
      
      setLeaderboardData([...leaderboardData, ...newPlayers]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow container py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <CardDescription>
              Top ranked coders competing in Code Duels
            </CardDescription>
          </div>
          
          <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="global">
          <TabsList className="mb-6">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="hidden md:table-cell text-right">W/L</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Win %</TableHead>
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
                      <TableCell className="hidden md:table-cell text-right">
                        <span className="text-primary">{player.wins}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-destructive">{player.losses}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right">
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
          </TabsContent>
          
          <TabsContent value="friends">
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Friends Added Yet</h3>
              <p className="text-muted-foreground mb-4">Add friends to see how you compare!</p>
              <Button>Add Friends</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="weekly">
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium">Weekly Challenges</h3>
              <p className="text-muted-foreground">Weekly rankings will reset every Sunday at midnight</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-4 border-t border-border text-center text-sm text-muted-foreground">
        Code Duels &copy; {new Date().getFullYear()} - Competitive Coding Platform
      </footer>
    </div>
  );
};

export default Leaderboard;
