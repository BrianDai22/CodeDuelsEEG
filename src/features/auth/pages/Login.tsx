import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { Input } from '@ui/form/input';
import { Label } from '@ui/form/label';
import { Alert, AlertDescription } from '@ui/feedback/alert';
import { AlertCircle, User } from 'lucide-react';
import LandingHeader from '@shared/components/LandingHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { useToast } from '@ui/feedback/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Save redirect location to sessionStorage (if it exists and is not home)
  useEffect(() => {
    // Check if we have a redirect path in location state
    const redirectPath = location.state?.from?.pathname;
    if (redirectPath && redirectPath !== '/') {
      sessionStorage.setItem('redirectAfterLogin', redirectPath);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter your email and password',
        variant: 'destructive',
      });
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
      // Navigation is now handled inside the login function after state updates
    }
  };

  const handleGuestLogin = async () => {
    const result = await loginAsGuest();
    
    if (!result.success) {
      toast({
        title: 'Guest Login Failed',
        description: result.error,
        variant: 'destructive',
      });
      // Navigation is now handled inside the loginAsGuest function after state updates
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 p-6 bg-card rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your Code Duels account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isGuestLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isGuestLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isGuestLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGuestLogin}
            disabled={isLoading || isGuestLoading}
          >
            {isGuestLoading ? (
              'Signing in...'
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Sign in as Guest
              </>
            )}
          </Button>

          <div className="text-center text-sm mt-4">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create one now
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 