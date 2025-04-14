import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Input } from '@ui/form/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@ui/data/table';
import { Badge } from '@ui/data/badge';
import { Card } from '@ui/data/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';
import AdminHeader from '@features/admin/components/AdminHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Shield, Search, Trophy, ArrowUpDown, Star, User, Ban, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Sample leaderboard data
const leaderboardData = [
  { id: 1, rank: 1, username: 'codemaster', wins: 157, losses: 23, winRate: 87.2, status: 'premium', actions: ['edit', 'ban'] },
  { id: 2, rank: 2, username: 'devninja', wins: 142, losses: 31, winRate: 82.1, status: 'premium', actions: ['edit', 'ban'] },
  { id: 3, rank: 3, username: 'algoguru', wins: 139, losses: 45, winRate: 75.5, status: 'admin', actions: ['edit'] },
  { id: 4, rank: 4, username: 'bytewarrior', wins: 124, losses: 41, winRate: 75.1, status: 'standard', actions: ['edit', 'ban'] },
  { id: 5, rank: 5, username: 'hackpro', wins: 118, losses: 39, winRate: 75.2, status: 'banned', actions: ['edit', 'unban'] },
  { id: 6, rank: 6, username: 'codesmith', wins: 112, losses: 37, winRate: 75.2, status: 'standard', actions: ['edit', 'ban'] },
  { id: 7, rank: 7, username: 'pythoncoder', wins: 103, losses: 42, winRate: 71.0, status: 'premium', actions: ['edit', 'ban'] },
  { id: 8, rank: 8, username: 'javascriptninja', wins: 98, losses: 45, winRate: 68.5, status: 'standard', actions: ['edit', 'ban'] },
  { id: 9, rank: 9, username: 'rustdeveloper', wins: 94, losses: 39, winRate: 70.7, status: 'standard', actions: ['edit', 'ban'] },
  { id: 10, rank: 10, username: 'golangexpert', wins: 89, losses: 44, winRate: 66.9, status: 'standard', actions: ['edit', 'ban'] },
];

export default function AdminLeaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  // Filter and sort data based on search term, sort column, sort direction, and selected tab
  const filteredData = leaderboardData
    .filter(item => {
      // Filter by search term
      if (searchTerm && !item.username.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by tab
      if (selectedTab !== 'all' && item.status !== selectedTab) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by column
      if (a[sortColumn] < b[sortColumn]) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (a[sortColumn] > b[sortColumn]) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAction = (action, userId) => {
    const user = leaderboardData.find(u => u.id === userId);
    
    switch (action) {
      case 'edit':
        setSelectedUser(user);
        toast.info(`Editing user: ${user.username}`);
        break;
      case 'ban':
        toast.success(`User ${user.username} has been banned`);
        break;
      case 'unban':
        toast.success(`User ${user.username} has been unbanned`);
        break;
      default:
        break;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'premium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Premium</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Banned</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Standard</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="flex-grow container py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Leaderboard</h1>
              <p className="text-muted-foreground">Manage and monitor user rankings</p>
            </div>
            
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5">
              <Shield className="h-4 w-4 mr-1.5" />
              Admin View
            </Badge>
          </div>

          {/* Filters and Actions */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex-shrink-0">
                <Tabs defaultValue="all" className="w-[400px]" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="standard">Standard</TabsTrigger>
                    <TabsTrigger value="premium">Premium</TabsTrigger>
                    <TabsTrigger value="banned">Banned</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </Card>

          {/* Leaderboard Table */}
          <Card>
            <Table>
              <TableCaption>User rankings and statistics with administrative actions.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('rank')}>
                    <div className="flex items-center">
                      Rank
                      {sortColumn === 'rank' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('username')}>
                    <div className="flex items-center">
                      Username
                      {sortColumn === 'username' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('wins')}>
                    <div className="flex items-center justify-end">
                      Wins
                      {sortColumn === 'wins' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('losses')}>
                    <div className="flex items-center justify-end">
                      Losses
                      {sortColumn === 'losses' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('winRate')}>
                    <div className="flex items-center justify-end">
                      Win Rate
                      {sortColumn === 'winRate' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.rank <= 3 ? (
                        <div className="flex items-center">
                          <Trophy className={`h-4 w-4 mr-1 ${
                            row.rank === 1 ? 'text-yellow-500' : 
                            row.rank === 2 ? 'text-gray-400' : 
                            'text-amber-600'
                          }`} />
                          {row.rank}
                        </div>
                      ) : row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-medium">{row.username}</span>
                        {row.status === 'premium' && (
                          <Star className="h-4 w-4 ml-1 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.wins}</TableCell>
                    <TableCell className="text-right">{row.losses}</TableCell>
                    <TableCell className="text-right">{row.winRate}%</TableCell>
                    <TableCell>{renderStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {row.actions.includes('edit') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAction('edit', row.id)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        {row.actions.includes('ban') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAction('ban', row.id)}
                          >
                            <Ban className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        {row.actions.includes('unban') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAction('unban', row.id)}
                          >
                            <User className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
      
      <LandingFooter />
    </div>
  );
} 