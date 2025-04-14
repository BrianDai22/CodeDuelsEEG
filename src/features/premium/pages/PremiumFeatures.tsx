import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { usePremium } from '@shared/context/PremiumContext';
import { toast } from 'sonner';
import { verifyBackendRole } from '@shared/utils/frontendBackendSeparation';

export default function PremiumFeatures() {
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading, verifyPremiumStatus } = usePremium();
  const [isVerifying, setIsVerifying] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for canceled checkout or successful payment in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.get('canceled') === 'true') {
      toast.info('Checkout was canceled. You can try again whenever you\'re ready.');
    } else if (params.get('success') === 'true') {
      toast.success('Thank you for your purchase! Your premium features are now active.');
      // Clear the URL parameters to prevent showing the message again on refresh
      navigate('/premium', { replace: true });
    }
  }, [location, navigate]);

  // Verify premium status on component mount with backend
  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) return;
      
      try {
        setIsVerifying(true);
        
        // Use our backend verification utility
        const hasPremiumAccess = await verifyBackendRole('getUserRole', 'isPremium');
        
        if (!hasPremiumAccess) {
          // If backend says no premium, redirect to upgrade page
          navigate('/premium/upgrade', { replace: true });
        }
      } catch (error) {
        console.error('Error verifying premium access:', error);
        toast.error('Could not verify premium status. Please try again later.');
      } finally {
        setIsVerifying(false);
      }
    };
    
    if (!premiumLoading) {
      verifyAccess();
    }
  }, [user, navigate, premiumLoading]);

  // Loading state while verifying with backend
  if (premiumLoading || isVerifying) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Verifying premium access...</p>
        </div>
      </div>
    );
  }

  // Only show premium content if user has premium access according to frontend state
  // (This is a user experience optimization, real security happens on the backend)
  if (!isPremium) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Premium Features</h1>
          <p className="text-lg text-muted-foreground mb-8">
            You need a premium subscription to access this content.
          </p>
          <button 
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md"
            onClick={() => navigate('/premium/upgrade')}
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  // Render premium content
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Premium Features</h1>
      <p className="text-lg mb-8">
        Welcome to the premium section! Here you can access exclusive content and features.
      </p>
      
      {/* Premium content goes here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Advanced Analytics</h2>
          <p>Get detailed insights and performance metrics for your activities.</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Premium Templates</h2>
          <p>Access to exclusive premium templates and resources.</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Priority Support</h2>
          <p>Get faster response times and dedicated support.</p>
        </div>
        
        <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Exclusive Content</h2>
          <p>Access special content only available to premium subscribers.</p>
        </div>
      </div>
    </div>
  );
} 