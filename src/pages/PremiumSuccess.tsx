import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Here you would typically verify the session with your backend
      // and update the user's premium status in your database
      toast.success('Welcome to Code Duels Premium!');
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your premium access has been activated. Enjoy your new features!
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Start Coding
            </Button>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 