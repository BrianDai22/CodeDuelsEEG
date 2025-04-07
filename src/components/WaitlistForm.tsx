import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface WaitlistFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const WaitlistForm = ({ onSuccess, onError }: WaitlistFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Replace this URL with your Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyahkL8K4j6JODwSDpiMFXe0acygMF6JDiGqxA6obmTMKzP3w84iBqt1RkE3ASSq_Uh/exec';

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setErrorMessage('Email is required');
      onError?.('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      onError?.('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setStatus('idle');
    
    try {
      // Send to Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // This is important for Google Apps Script
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(email)}`,
      });
      
      // Since we're using no-cors, we can't check response.ok
      // We'll assume success if no error is thrown
      
      // Also store in localStorage for the counter
      const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
      waitlist.push({ email, timestamp: new Date().toISOString() });
      localStorage.setItem('waitlist', JSON.stringify(waitlist));
      
      setStatus('success');
      setEmail('');
      onSuccess?.();
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to join waitlist. Please try again.');
      onError?.('Failed to join waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join the Waitlist</CardTitle>
        <CardDescription>
          Be the first to know when Code Duels launches. Sign up for early access.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || status === 'success'}
                className={status === 'error' ? 'border-red-500' : ''}
              />
              {status === 'error' && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {errorMessage}
                </p>
              )}
              {status === 'success' && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  You've been added to the waitlist!
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || status === 'success'}
          >
            {isLoading ? 'Joining...' : status === 'success' ? 'Joined!' : 'Join Waitlist'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default WaitlistForm; 