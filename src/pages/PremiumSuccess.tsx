import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { CheckCircle, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { verifyPremiumPayment } from '@/lib/api';

export default function PremiumSuccess() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user has premium access (either purchased or admin)
  useEffect(() => {
    // Admin users automatically have premium access
    if (isAdmin) {
      setIsPremium(true);
      return;
    }
    
    // Check if user has premium in localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      setIsPremium(profile.isPremium || false);
    }
  }, [isAdmin]);

  // Check for session_id in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId && user) {
      // Verify the session and update premium status
      const verifyPayment = async () => {
        try {
          setIsVerifying(true);
          
          // Verify the payment and update premium status
          const success = await verifyPremiumPayment(
            sessionId,
            user.id,
            user.email || ''
          );
          
          if (success) {
            setIsPremium(true);
            toast.success('Thank you for your purchase! Your premium features are now active.');
            
            // Redirect to premium page after a short delay
            const timer = setTimeout(() => {
              navigate('/premium');
            }, 3000);
            
            return () => clearTimeout(timer);
          } else {
            toast.error('Failed to verify your payment. Please contact support.');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          toast.error('An error occurred while verifying your payment.');
        } finally {
          setIsVerifying(false);
        }
      };
      
      verifyPayment();
    }
  }, [location, navigate, user]);

  return (
    <div className="min-h-screen flex flex-col">
      {!user ? (
        <GuestHeader />
      ) : isAdmin || isPremium ? (
        <PremiumHeader />
      ) : (
        <UserHeader />
      )}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              {isAdmin ? (
                <Shield className="h-16 w-16 text-green-500" />
              ) : isVerifying ? (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              {isAdmin 
                ? 'Admin Access Confirmed' 
                : isVerifying 
                  ? 'Verifying Your Payment...' 
                  : 'Premium Access Activated!'}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              {isAdmin 
                ? "As an admin, you have automatic access to all premium features." 
                : isVerifying
                  ? "Please wait while we verify your payment and activate your premium features."
                  : "Thank you for your purchase! You now have access to all premium features."}
            </p>
            
            {!isVerifying && (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/premium')}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Go to Premium Features
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 