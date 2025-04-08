import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import LandingFooter from '@/components/LandingFooter';
import { Zap, Trophy, BarChart, Award, Code, Loader2, Crown, Sparkles, Shield } from 'lucide-react';
import { stripePromise, createCheckoutSession } from '@/lib/stripe';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

const premiumFeatures = [
  {
    title: 'Weekly Power-Ups',
    description: 'Get 5 power-ups every week to gain an edge in your duels.',
    icon: Zap,
  },
  {
    title: 'Priority Matchmaking',
    description: 'Skip the queue and find matches faster with priority matchmaking.',
    icon: Trophy,
  },
  {
    title: 'Advanced Statistics',
    description: 'Access detailed statistics and analytics about your performance.',
    icon: BarChart,
  },
  {
    title: 'Custom Profile Badges',
    description: 'Show off your achievements with exclusive profile badges.',
    icon: Award,
  },
  {
    title: 'Practice Mode',
    description: 'Practice coding challenges without affecting your rating.',
    icon: Code,
  },
  {
    title: 'Exclusive Themes',
    description: 'Access premium UI themes and customization options for your profile.',
    icon: Sparkles,
  },
];

export default function PremiumFeatures() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
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

  // Check for canceled checkout or successful payment
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

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/premium' } });
      return;
    }

    try {
      setIsLoading(true);
      
      // Store the current URL in sessionStorage to handle back navigation
      sessionStorage.setItem('premiumCheckoutOrigin', window.location.href);
      
      const response = await fetch('http://localhost:3000/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_1RBQMVFWbRjScRrluyc3Q8vM', // Replace with your actual price ID
          customerEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { id: sessionId } = await response.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast.error('Failed to initiate checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle browser back button from Stripe checkout
  useEffect(() => {
    const handlePopState = () => {
      const origin = sessionStorage.getItem('premiumCheckoutOrigin');
      if (origin) {
        sessionStorage.removeItem('premiumCheckoutOrigin');
        toast.info('You returned from the checkout page. Your session is still active.');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Premium Features</h1>
            {isPremium ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-sm">
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
              </div>
            ) : null}
            <p className="text-xl text-muted-foreground">
              {isPremium 
                ? "You have access to all premium features. Enjoy!" 
                : "Unlock the full potential of Code Duels with our premium features"}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {premiumFeatures.map((feature) => (
              <Card key={feature.title} className={`p-6 ${isPremium ? 'border-green-200 bg-green-50/30' : ''}`}>
                <feature.icon className={`w-12 h-12 mb-4 ${isPremium ? 'text-green-500' : 'text-primary'}`} />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
                {isPremium && (
                  <Badge variant="outline" className="mt-4 bg-green-100 text-green-800 border-green-200">
                    Unlocked
                  </Badge>
                )}
              </Card>
            ))}
          </div>

          {!isPremium && (
            <div className="text-center">
              <Card className="p-8 max-w-lg mx-auto">
                <Badge variant="secondary" className="mb-4">Lifetime Access</Badge>
                <h2 className="text-3xl font-bold mb-4">$5</h2>
                <p className="text-muted-foreground mb-6">
                  One-time payment for lifetime access to all premium features
                </p>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={handlePurchase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Get Lifetime Premium Access
                    </>
                  )}
                </Button>
              </Card>
            </div>
          )}
          
          {isPremium && (
            <div className="text-center">
              <Card className="p-8 max-w-lg mx-auto bg-gray-100/30 border-gray-200">
                <Badge variant="default" className="mb-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-sm">
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
                <h2 className="text-3xl font-bold mb-4">All Features Unlocked</h2>
                <p className="text-muted-foreground mb-6">
                  {isAdmin 
                    ? "As an admin, you have automatic access to all premium features." 
                    : "Thank you for your purchase! You now have access to all premium features."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/')}
                  >
                    Go to Home
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 