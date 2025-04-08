import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import UserHeader from '@/components/UserHeader';
import GuestHeader from '@/components/GuestHeader';
import LandingFooter from '@/components/LandingFooter';
import { 
  Zap, 
  Trophy, 
  BarChart, 
  Award, 
  Code, 
  Crown, 
  Shield, 
  Star, 
  Clock, 
  Target, 
  Users, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { getUserProfile } from '@/lib/api';

// Premium dashboard sections
const premiumSections = [
  {
    title: 'My Power-Ups',
    description: 'Manage your weekly power-ups and special abilities',
    icon: Zap,
    link: '/battle',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50/30',
    borderColor: 'border-yellow-200'
  },
  {
    title: 'Match History',
    description: 'View detailed statistics and analysis of your matches',
    icon: BarChart,
    link: '/match-history',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50/30',
    borderColor: 'border-blue-200'
  },
  {
    title: 'Leaderboard',
    description: 'See your ranking and compare with other players',
    icon: Trophy,
    link: '/leaderboard',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50/30',
    borderColor: 'border-purple-200'
  },
  {
    title: 'Find Match',
    description: 'Use priority matchmaking to find opponents faster',
    icon: Target,
    link: '/find-match',
    color: 'text-green-500',
    bgColor: 'bg-green-50/30',
    borderColor: 'border-green-200'
  },
  {
    title: 'Practice Mode',
    description: 'Practice coding challenges without affecting your rating',
    icon: Code,
    link: '/practice',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50/30',
    borderColor: 'border-indigo-200'
  },
  {
    title: 'Profile Settings',
    description: 'Customize your profile with premium badges and themes',
    icon: Settings,
    link: '/settings',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50/30',
    borderColor: 'border-pink-200'
  }
];

// Premium stats
const premiumStats = [
  {
    title: 'Win Rate',
    value: '68%',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50/30',
    borderColor: 'border-yellow-200'
  },
  {
    title: 'Total Matches',
    value: '124',
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50/30',
    borderColor: 'border-purple-200'
  },
  {
    title: 'Power-Ups Left',
    value: '3/5',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50/30',
    borderColor: 'border-blue-200'
  },
  {
    title: 'Time Played',
    value: '12h 45m',
    icon: Clock,
    color: 'text-green-500',
    bgColor: 'bg-green-50/30',
    borderColor: 'border-green-200'
  }
];

export default function PremiumDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user has premium access
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const profile = await getUserProfile();
        setIsPremium(profile.isPremium || isAdmin);
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [isAdmin]);

  // Redirect non-premium users
  useEffect(() => {
    if (!loading && !isPremium) {
      navigate('/premium');
    }
  }, [loading, isPremium, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        <main className="flex-1 container py-6 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading premium dashboard...</p>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      <main className="flex-grow container py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Premium Dashboard</h1>
            <p className="text-muted-foreground">Your premium features and stats</p>
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
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Premium Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {premiumStats.map((stat) => (
              <Card key={stat.title} className={`p-4 ${stat.bgColor} ${stat.borderColor} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Premium Sections */}
          <h2 className="text-2xl font-bold mb-4">Premium Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {premiumSections.map((section) => (
              <Card 
                key={section.title} 
                className={`p-6 ${section.bgColor} ${section.borderColor} border cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => navigate(section.link)}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-full ${section.bgColor} mb-4`}>
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                <p className="text-muted-foreground">{section.description}</p>
              </Card>
            ))}
          </div>

          {/* Premium Community */}
          <h2 className="text-2xl font-bold mb-4">Premium Community</h2>
          <Card className="p-6 bg-gradient-to-r from-purple-50/30 to-blue-50/30 border-purple-200 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold mb-2">Join the Premium Community</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with other premium users, share strategies, and participate in exclusive events.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Users className="h-4 w-4 mr-2" />
                  Join Community
                </Button>
              </div>
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 