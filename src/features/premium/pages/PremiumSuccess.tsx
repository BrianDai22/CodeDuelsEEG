import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { Card } from '@ui/data/card';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { CheckCircle, Shield, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@shared/config/firebase';

export default function PremiumSuccess() {
  const { user, refreshUser } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const location = useLocation();
  const navigate = useNavigate();
  const functions = getFunctions();
  const verificationInitiatedRef = useRef(false);
  const sessionVerifiedRef = useRef(false);

  useEffect(() => {
    // Early exit if already verified or initiated
    if (sessionVerifiedRef.current) {
      return;
    }
    
    // Get the sessionId from URL - this won't change during component's lifecycle
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    // We need to wait for both sessionId and user to be available
    if (!sessionId) {
      setVerificationStatus('error');
      toast.error("No payment session found", {
        description: "Missing session information from payment provider."
      });
      sessionVerifiedRef.current = true; // Prevent further attempts
      return;
    }
    
    // Wait for user to be available before proceeding
    if (!user || !auth.currentUser) {
      // Don't set error yet, we're still waiting for auth
      return;
    }
    
    // Define an async function for verification
    const verifyPayment = async () => {
      // Prevent duplicate verification
      if (verificationInitiatedRef.current) {
        return;
      }
      
      // Mark as initiated to prevent future runs
      verificationInitiatedRef.current = true;
      
      try {
        const verifyPremiumPaymentFunc = httpsCallable<
          { sessionId: string }, 
          { success: boolean; message: string }
        >(functions, 'verifyPremiumPayment');
        
        // Call the Firebase function
        const result = await verifyPremiumPaymentFunc({ sessionId });
        
        // Mark as verified to prevent future verification attempts
        sessionVerifiedRef.current = true;
        
        if (result.data.success) {
          setVerificationStatus('success');
          toast.success(result.data.message || 'Thank you! Premium features activated.', {
            duration: 5000
          });
          // Refresh the user data to get updated premium status
          await refreshUser();
          // Ensure we show the user as premium even if refreshUser hasn't updated the state yet
          localStorage.setItem('userProfile', JSON.stringify({
            ...JSON.parse(localStorage.getItem('userProfile') || '{}'),
            isPremium: true
          }));
        } else {
          setVerificationStatus('error');
          toast.error(result.data.message || 'Failed to verify payment. Please contact support.', {
            duration: 5000
          });
        }
      } catch (error: any) {
        setVerificationStatus('error');
        toast.error('An error occurred while verifying your payment.', {
          description: 'Please try again or contact support.',
          duration: 5000
        });
        // Mark as verified even on error to prevent constant retries
        sessionVerifiedRef.current = true;
      }
    };
    
    // Add a slight delay to give auth time to initialize
    const timer = setTimeout(() => {
      if (user && !verificationInitiatedRef.current) {
        verifyPayment();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user, location.search, refreshUser]);

  const isLoading = verificationStatus === 'verifying';
  const isSuccess = verificationStatus === 'success' || (user?.isPremium === true);
  const isError = verificationStatus === 'error' && !user?.isPremium;

  const renderHeader = () => {
    if (!user) {
        return <LandingHeader />;
    } else if (user.isAdmin || user.isPremium) {
        return <PremiumHeader />;
    } else if (user.id.startsWith('guest_')) {
        return <GuestHeader />;
    } else {
        return <UserHeader />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {renderHeader()}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8">
            <div className="flex justify-center mb-6">
              {isLoading ? (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              ) : isSuccess ? (
                user?.isAdmin ? <Shield className="h-16 w-16 text-green-500" /> : <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <CheckCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              {isLoading 
                ? 'Processing...' 
                : isSuccess
                  ? (user?.isAdmin ? 'Admin Access Confirmed' : 'Premium Access Activated!')
                  : 'Payment Verification Failed'}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              {isLoading 
                ? 'Please wait while we confirm your premium status.'
                : isSuccess 
                  ? (user?.isAdmin ? "As an admin, you have automatic access to all premium features." : "Thank you! You now have access to all premium features.")
                  : "We couldn\'t verify your payment. Please check your details or contact support."}
            </p>
            
            {!isLoading && (
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className={isSuccess ? "bg-green-600 hover:bg-green-700" : "bg-primary"}
                  onClick={() => navigate(isSuccess ? '/premium-dashboard' : '/premium')}
                >
                  {isSuccess ? <Crown className="mr-2 h-4 w-4" /> : null}
                  {isSuccess ? 'Go to Premium Dashboard' : 'Return to Premium Page'}
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