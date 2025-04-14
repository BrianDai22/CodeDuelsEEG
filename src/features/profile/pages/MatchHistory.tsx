import { useState, useEffect } from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { usePremium } from '@shared/context/PremiumContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/data/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/data/table';
import { Badge } from '@ui/data/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@ui/feedback/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';
import { Crown, BarChart, Trophy, Clock, ArrowRight, Shield } from 'lucide-react';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';

// Sample match data - replace with actual data from your backend
const sampleMatches = [
  {
    id: '1',
    opponent: 'CodeMaster123',
    date: '2024-03-15T14:30:00Z',
    result: 'win',
    score: '3-1',
    duration: '15:30',
    language: 'JavaScript',
    difficulty: 'Medium'
  },
  {
    id: '2',
    opponent: 'AlgoNinja',
    date: '2024-03-14T16:45:00Z',
    result: 'loss',
    score: '1-3',
    duration: '12:15',
    language: 'Python',
    difficulty: 'Hard'
  },
  {
    id: '3',
    opponent: 'ByteWarrior',
    date: '2024-03-13T09:20:00Z',
    result: 'win',
    score: '3-0',
    duration: '10:45',
    language: 'JavaScript',
    difficulty: 'Easy'
  }
];

// Sample analytics data for premium users
const sampleAnalytics = {
  totalMatches: 42,
  winRate: '65%',
  averageScore: '2.8',
  favoriteLanguage: 'JavaScript',
  bestTime: '08:30',
  totalTime: '12h 30m',
  streak: 5,
  rank: 'Gold',
  recentPerformance: [
    { date: '2024-03-15', performance: 85 },
    { date: '2024-03-14', performance: 72 },
    { date: '2024-03-13', performance: 90 },
    { date: '2024-03-12', performance: 78 },
    { date: '2024-03-11', performance: 88 }
  ]
};

export default function MatchHistory() {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState(sampleMatches);
  const [analytics, setAnalytics] = useState(sampleAnalytics);

  useEffect(() => {
    // Fetch actual match history and premium status
    // This is where you'd make API calls to get real data
  }, [isPremium, isAdmin]);

  const handleViewAnalytics = () => {
    if (!isPremium) {
      // Show premium dialog
      return;
    }
    // Navigate to detailed analytics
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'win':
        return 'bg-green-100 text-green-800';
      case 'loss':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {location.pathname.startsWith('/premium/') ? (
        <PremiumHeader />
      ) : (
        isPremium ? <PremiumHeader /> : <LandingHeader />
      )}
      
      <main className="flex-grow container py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Match History</h1>
            <p className="text-muted-foreground">Your competitive coding matches</p>
          </div>
          
          <div className="flex items-center gap-3">
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
            <Button 
              variant="outline" 
              onClick={() => navigate(isPremium ? '/premium/find-match' : '/find-match')}
              className="flex items-center space-x-2"
            >
              <Trophy className="h-4 w-4" />
              <span>Find Match</span>
            </Button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto space-y-8">
          <Tabs defaultValue="recent" className="space-y-4">
            <TabsList>
              <TabsTrigger value="recent">Recent Matches</TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart className="h-4 w-4" />
                <span>Analytics</span>
                {!isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Matches</CardTitle>
                  <CardDescription>Your latest competitive matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Opponent</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>{formatDate(match.date)}</TableCell>
                          <TableCell>{match.opponent}</TableCell>
                          <TableCell>
                            <Badge className={getResultColor(match.result)}>
                              {match.result.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{match.score}</TableCell>
                          <TableCell>{match.duration}</TableCell>
                          <TableCell>{match.language}</TableCell>
                          <TableCell>{match.difficulty}</TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Match Details</DialogTitle>
                                  <DialogDescription>
                                    {isPremium ? (
                                      "Detailed match analysis and statistics"
                                    ) : (
                                      <div className="space-y-4">
                                        <p>Upgrade to Premium to view detailed match analysis!</p>
                                        <Button 
                                          onClick={() => navigate('/premium')}
                                          className="w-full"
                                        >
                                          <Crown className="h-4 w-4 mr-2" />
                                          Upgrade to Premium
                                        </Button>
                                      </div>
                                    )}
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              {isPremium ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span>Performance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Win Rate</span>
                          <span className="font-medium">{analytics.winRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average Score</span>
                          <span className="font-medium">{analytics.averageScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Streak</span>
                          <span className="font-medium">{analytics.streak} matches</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Time Stats</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Time</span>
                          <span className="font-medium">{analytics.bestTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Time</span>
                          <span className="font-medium">{analytics.totalTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Matches</span>
                          <span className="font-medium">{analytics.totalMatches}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart className="h-5 w-5" />
                        <span>Rank & Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Rank</span>
                          <Badge variant="secondary">{analytics.rank}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Favorite Language</span>
                          <span className="font-medium">{analytics.favoriteLanguage}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <span>Premium Analytics</span>
                    </CardTitle>
                    <CardDescription>
                      Upgrade to Premium to access detailed match analytics and statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Get access to:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Detailed performance metrics</li>
                        <li>Win rate and streak tracking</li>
                        <li>Time-based statistics</li>
                        <li>Rank progression analysis</li>
                        <li>Language proficiency insights</li>
                      </ul>
                      <Button 
                        onClick={() => navigate('/premium')}
                        className="w-full mt-4"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 