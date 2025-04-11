import { useState } from 'react';
import { Button } from '@ui/button';
import { Input } from '@ui/form/input';
import { Card, CardContent, CardFooter } from '@ui/data/card';
import { CheckCircle, XCircle } from 'lucide-react';

interface WaitlistFormProps {
  onSubmit?: (email: string) => void;
}

const WaitlistForm = ({ onSubmit }: WaitlistFormProps) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setErrorMessage('Please enter your email address');
      return;
    }

    setStatus('submitting');
    
    try {
      // Here you would normally send the email to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      if (onSubmit) onSubmit(email);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <Card className="max-w-md w-full">
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          {status === 'success' ? (
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 p-3 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm">Thanks! We'll be in touch soon.</p>
            </div>
          ) : status === 'error' ? (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-3 rounded-md">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting'}
                className="w-full text-center"
              />
              <p className="text-xs text-muted-foreground">
                Get early access when we launch. We never share your email.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          {status !== 'success' && (
            <Button 
              type="submit" 
              className="w-full"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Joining...' : 'Join Waitlist'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default WaitlistForm; 