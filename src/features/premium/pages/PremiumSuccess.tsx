import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    
    if (sessionId && user) {
      const verifyPayment = async () => {
        setVerificationStatus('verifying');
        try {
          const verifyPremiumPaymentFunc = httpsCallable<{ sessionId: string }, { success: boolean; message: string }>(functions, 'verifyPremiumPayment');
          if (!auth.currentUser) {
             throw new Error("User not authenticated to verify payment.");
          }
          const result = await verifyPremiumPaymentFunc({ sessionId });
          
          if (result.data.success) {
            setVerificationStatus('success');
            toast.success(result.data.message || 'Thank you! Premium features activated.');
            await refreshUser();
          } else {
            setVerificationStatus('error');
            toast.error(result.data.message || 'Failed to verify payment. Please contact support.');
          }
        } catch (error: any) {
          console.error('Error calling verifyPremiumPayment function:', error);
          setVerificationStatus('error');
          toast.error(error.message || 'An error occurred while verifying your payment.');
        }
      };
      
      verifyPayment();
    } else if (!sessionId && user) {
        if (user.isPremium) {
            setVerificationStatus('success');
        } else {
            toast.info("Redirecting to premium page...");
            navigate('/premium');
        }
    } else if (!user) {
        setVerificationStatus('verifying');
    }
  }, [location, navigate, user, functions, refreshUser]);

  const isLoading = verificationStatus === 'verifying';
  const isSuccess = verificationStatus === 'success' || (user?.isPremium && verificationStatus !== 'error');
  const isError = verificationStatus === 'error';

  const renderHeader = () => {
    if (isLoading || !user) {
        return <GuestHeader />;
    } else if (user.isAdmin || user.isPremium) {
        return <PremiumHeader />;
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
                  onClick={() => navigate('/premium')}
                >
                  {isSuccess ? <Crown className="mr-2 h-4 w-4" /> : null}
                  {isSuccess ? 'Go to Premium Features' : 'Return to Premium Page'}
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