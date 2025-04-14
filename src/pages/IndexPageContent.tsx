import React from 'react';
import LandingHeader from '@shared/components/LandingHeader';
import LandingFooter from '@shared/components/LandingFooter';
import WaitlistForm from '@shared/components/WaitlistForm';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { useNavigate } from 'react-router-dom';

// TODO: Replace this with the actual content/layout for the Index page
const IndexPageContent = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-16 px-4 flex-1 flex flex-col items-center justify-between">
        <div className="container mx-auto max-w-2xl text-center mt-8">
          {/* Main Content */}
          <h1 className="text-5xl font-bold mb-8 tracking-tight bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
            Welcome to CodeDuels!
          </h1>
          <p className="text-xl text-muted-foreground mb-16 mx-auto">
            Compete in real-time coding challenges and sharpen your skills.
          </p>
            
          {/* Waitlist Form */}
          <div className="w-full max-w-md mx-auto mb-24">
            <WaitlistForm />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-10 justify-center mb-16">
            <Button size="lg" className="px-8 py-5 text-lg" onClick={() => navigate('/find-match')}>
              Find Match
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-5 text-lg" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </Button>
            <Button size="lg" variant="secondary" className="px-8 py-5 text-lg" onClick={() => navigate('/code-editor')}>
              Python Code Editor
            </Button>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default IndexPageContent; 