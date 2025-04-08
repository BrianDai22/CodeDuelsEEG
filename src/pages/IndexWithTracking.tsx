import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrackedButton } from '@/components/ui/tracked';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Code, Trophy } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import WaitlistForm from '@/components/WaitlistForm';
import { useAuth } from '@/contexts/AuthContext';

const IndexWithTracking = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [submissionCount, setSubmissionCount] = useState(() => {
    // Get count from localStorage
    const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
    // Add 114 to the actual count to show that many people have already joined
    return waitlist.length + 114;
  });

  const handleWaitlistSuccess = () => {
    setSubmissionCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-3xl w-full text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Code Duels
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            Battle other coders in real-time competitive programming matches
          </p>
          
          {/* Waitlist Form */}
          <div className="mb-10">
            <WaitlistForm onSuccess={handleWaitlistSuccess} />
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-semibold text-primary">{submissionCount}</span> people have joined the waitlist
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mb-10">
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
      </main>
      
      <footer className="py-4 border-t border-border text-center text-sm text-muted-foreground">
        Code Duels &copy; {new Date().getFullYear()} - Competitive Coding Platform
      </footer>
    </div>
  );
};

export default IndexWithTracking; 