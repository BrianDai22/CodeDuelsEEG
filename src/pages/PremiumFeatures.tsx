import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import { Zap, Trophy, BarChart, Award, Code, Loader2, Crown, Sparkles } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for canceled checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('canceled') === 'true') {
      toast.info('Checkout was canceled. You can try again whenever you\'re ready.');
    }
  }, [location]);

  const handlePurchase = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    try {
      setIsLoading(true);
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

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Premium Features</h1>
            <p className="text-xl text-muted-foreground">
              Unlock the full potential of Code Duels with our premium features
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {premiumFeatures.map((feature) => (
              <Card key={feature.title} className="p-6">
                <feature.icon className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

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
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 