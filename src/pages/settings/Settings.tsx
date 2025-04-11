import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { Input } from '@ui/form/input';
import { Label } from '@ui/form/label';
import { Alert, AlertDescription, AlertTitle } from '@ui/feedback/alert';
import { AlertCircle, Save, Upload, User, Loader2, Lock, Camera, Crown, Shield } from 'lucide-react';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/data/card';
import { Avatar, AvatarImage, AvatarFallback } from '@ui/data/avatar';
import { toast } from 'sonner';
import ImageEditor from '@shared/components/ImageEditor';
import PremiumPaymentHistory from '@features/premium/components/PremiumPaymentHistory';
import { Badge } from '@ui/data/badge';

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updateUserProfile: contextUpdateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    photoURL: ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [previewPhotoURL, setPreviewPhotoURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const isPremium = user?.isPremium || false;
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.username || '',
        photoURL: user.photoURL || ''
      });
      setPreviewPhotoURL(user.photoURL || null);
    } else if (!authLoading) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          toast.error('Failed to process image');
          setIsUploading(false);
          return;
        }
        const dataURL = event.target.result as string;
        setOriginalImage(dataURL);
        setShowImageEditor(true);
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error handling photo:', err);
      toast.error('Failed to update photo. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSaveImage = async (dataURL: string) => {
    setPreviewPhotoURL(dataURL);
    setFormData(prev => ({ ...prev, photoURL: dataURL }));
    setShowImageEditor(false);
    toast.success('Photo preview updated. Save changes to apply.');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || authLoading) return;

    setIsSubmittingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: { username?: string; photoURL?: string; } = {};
      if (formData.displayName !== (user.displayName || user.username)) updateData.username = formData.displayName;
      if (previewPhotoURL !== user.photoURL) updateData.photoURL = previewPhotoURL || '';

      if (Object.keys(updateData).length > 0) {
        const result = await contextUpdateProfile(updateData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to update profile');
        }
        setSuccess('Profile updated successfully');
      } else {
        setSuccess('No profile changes to save.');
      }
    } catch (err: any) {
      console.error("Profile submit error:", err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || authLoading || !currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmittingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await contextUpdateProfile({
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err: any) {
      console.error("Password submit error:", err);
      setError(err.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const renderHeader = () => {
    if (authLoading) return <GuestHeader />;
    if (!user) return <GuestHeader />;
    if (isAdmin || isPremium) return <PremiumHeader />;
    return <UserHeader />;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }
  
  if (!user) { 
    return (
      <div className="min-h-screen flex flex-col">
        <GuestHeader />
        <main className="flex-1 flex items-center justify-center">Redirecting to login...</main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {renderHeader()}
      
      <main className="flex-grow container py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

         {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-green-500 bg-green-50 text-green-800"> 
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                 <User className="mr-2 h-5 w-5" /> Profile Settings
              </CardTitle>
              <CardDescription>
                Update your display name and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={previewPhotoURL || undefined} alt={formData.displayName} />
                    <AvatarFallback>{formData.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isSubmittingProfile}>
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                      Change Photo
                    </Button>
                    <Input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange} 
                      className="hidden" 
                    />
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 2MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    name="displayName" 
                    value={formData.displayName} 
                    onChange={handleInputChange} 
                    disabled={isSubmittingProfile}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={user.email || 'N/A'} 
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
                
                 <Button type="submit" disabled={isSubmittingProfile || authLoading}>
                   {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                   Save Profile Changes
                 </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Lock className="mr-2 h-5 w-5" /> Change Password
              </CardTitle>
              <CardDescription>
                Update your account password. Requires current password.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      name="currentPassword"
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isSubmittingPassword}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      name="newPassword"
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmittingPassword}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmittingPassword}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingPassword || authLoading || !currentPassword || !newPassword}>
                    {isSubmittingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Password
                  </Button>
               </form>
            </CardContent>
          </Card>
          
          {(isPremium || isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Crown className="mr-2 h-5 w-5 text-yellow-500" /> Premium Status
                </CardTitle>
                <CardDescription>
                  View your premium membership details and payment history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Badge variant="default" className="mb-4 bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm">
                   {isAdmin ? (
                     <><Shield className="h-5 w-5 mr-1.5" /> Admin Access</>
                   ) : (
                     <><Crown className="h-4 w-4 mr-1" /> Premium Active</>
                   )}
                 </Badge>
                 <PremiumPaymentHistory />
              </CardContent>
            </Card>
          )}
          
        </div>
      </main>
      
      {showImageEditor && originalImage && (
        <ImageEditor 
          isOpen={showImageEditor}
          onClose={() => setShowImageEditor(false)}
          onSave={handleSaveImage}
          imageDataURL={originalImage}
        />
      )}
      
      <LandingFooter />
    </div>
  );
} 