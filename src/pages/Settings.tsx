import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Upload, User, Loader2, Shield, Mail, Lock, Camera, Crown } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import UserHeader from '@/components/UserHeader';
import GuestHeader from '@/components/GuestHeader';
import LandingFooter from '@/components/LandingFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { updateUserProfile, getUserProfile } from '../lib/api';
import { Switch } from '@/components/ui/switch';
import ImageEditor from '../components/ImageEditor';
import PremiumPaymentHistory from '@/components/PremiumPaymentHistory';
import { User as AuthUser } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

// List of authorized admin emails
const AUTHORIZED_ADMIN_EMAILS = [
  'admin@example.com', 
  'mooprules@gmail.com',
  'test@example.com',
  'user@example.com',
  'brian@example.com'
];

interface UpdateUserProfileParams {
  displayName?: string;
  email?: string;
  photoURL?: string;
  isAdmin?: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuth();
  const { isAdmin, isAdminMode, setIsAdminMode, setIsAdmin } = useAdmin();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [previewPhotoURL, setPreviewPhotoURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Always start with false for guests
  const [isPremium, setIsPremium] = useState(false);
  // Add pending admin state
  const [pendingAdminState, setPendingAdminState] = useState(false);
  
  // Image editing state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || ''
  });

  // Function to ensure premium status is maintained
  const ensurePremiumStatus = (userData: any) => {
    if (!userData) return null;
    
    // Check localStorage for premium status
    const userProfile = localStorage.getItem('userProfile');
    let isPremium = false;
    let isAdmin = userData.isAdmin; // Use the admin status from the user data
    
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      isPremium = profile.isPremium || false;
      // Only use the profile's admin status if it's not explicitly set in userData
      if (userData.isAdmin === undefined) {
        isAdmin = profile.isAdmin || false;
      }
    }
    
    // Return updated user object with preserved premium status
    return {
      ...userData,
      isPremium: isPremium || userData.isPremium || false,
      isAdmin: isAdmin // Use the admin status we determined
    };
  };

  // Check if user has premium access
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        // Guest accounts are never premium
        if (!isAuthenticated || !user) {
          setIsPremium(false);
          return;
        }

        // Check if user has premium in localStorage first
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          const profile = JSON.parse(userProfile);
          // Only consider authenticated users with premium or admin status
          if (profile.isPremium || (isAdmin && !!user)) {
            setIsPremium(true);
            return;
          }
        }

        // If not in localStorage, check with the API
        const profile = await getUserProfile();
        // Only consider authenticated users with premium or admin status
        const hasPremium = profile.isPremium || (isAdmin && !!user);
        setIsPremium(hasPremium);

        // Update localStorage
        if (hasPremium) {
          const storedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
          storedProfile.isPremium = true;
          localStorage.setItem('userProfile', JSON.stringify(storedProfile));
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        // Don't reset isPremium here, maintain the localStorage value
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile && isAuthenticated && user) {
          const profile = JSON.parse(userProfile);
          // Only consider authenticated users with premium or admin status
          setIsPremium(profile.isPremium || (isAdmin && !!user));
        } else if (isAdmin && !!user) {
          // If user is admin, they should always be premium
          setIsPremium(true);
        } else {
          // If no profile in localStorage or not authenticated, default to non-premium
          setIsPremium(false);
        }
      }
    };

    checkPremiumStatus();
  }, [user, isAdmin, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || user.username || '',
        email: user.email || '',
        photoURL: user.photoURL || ''
      }));
      setPhotoURL(user.photoURL || null);
      setPreviewPhotoURL(user.photoURL || null);
    }
  }, [user]);

  // Update pending admin state when isAdmin changes
  useEffect(() => {
    setPendingAdminState(isAdmin);
  }, [isAdmin]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a temporary preview
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
    } catch (error) {
      console.error('Error handling photo:', error);
      toast.error('Failed to update photo. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSaveImage = async (dataURL: string) => {
    try {
      setIsUploading(true);
      
      // Only update the preview and form data
      setPreviewPhotoURL(dataURL);
      setFormData(prev => ({
        ...prev,
        photoURL: dataURL
      }));
      
      toast.success('Photo preview updated');
      setIsUploading(false);
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast.error('Failed to save photo. Please try again.');
      setIsUploading(false);
    }
  };

  const handleAdminToggle = () => {
    // Guest users can't toggle admin status
    if (!isAuthenticated || !user || user.id.startsWith('guest_')) {
      toast.error('Guest users cannot access admin features');
      return;
    }
    
    // Just update the pending state
    setPendingAdminState(!pendingAdminState);
    
    // Show a toast message to inform the user that changes will be applied when saved
    toast.info(`Admin status will be ${!pendingAdminState ? 'enabled' : 'disabled'} when you save changes`);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile({
        displayName: formData.displayName,
        email: formData.email,
        photoURL: formData.photoURL
      });
      
      // Get the updated profile to ensure premium status is maintained
      const updatedProfile = await getUserProfile();
      if (updatedProfile && user) {
        // Use the ensurePremiumStatus function to preserve premium status
        const userWithPremiumStatus = ensurePremiumStatus({
          ...user,
          ...updatedProfile
        });
        
        if (userWithPremiumStatus) {
          setUser(userWithPremiumStatus);
        }
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      
      // Preserve the user's premium status even when an error occurs
      if (user) {
        const userWithPremiumStatus = ensurePremiumStatus(user);
        if (userWithPremiumStatus) {
          setUser(userWithPremiumStatus);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the current user is authorized to see the admin toggle
  const isAuthorizedAdmin = user?.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email) && !user.id.startsWith('guest_');
  
  // Debug information
  useEffect(() => {
    console.log('User email:', user?.email);
    console.log('Is authorized admin:', isAuthorizedAdmin);
    console.log('Current admin status:', isAdmin);
    console.log('Current admin mode:', isAdminMode);
  }, [user, isAuthorizedAdmin, isAdmin, isAdminMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.uid.startsWith('guest_')) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create params object with only changed fields
      const params: UpdateUserProfileParams = {};
      if (formData.displayName !== user.displayName) params.displayName = formData.displayName;
      if (formData.email !== user.email) params.email = formData.email;
      if (formData.photoURL !== user.photoURL) params.photoURL = formData.photoURL;
      
      // Always include the admin status in the update if it's changed
      if (pendingAdminState !== isAdmin) {
        params.isAdmin = pendingAdminState;
      }

      // Update profile
      await updateUserProfile(params);
      
      // Update admin context first if admin status changed
      if (params.isAdmin !== undefined) {
        setIsAdmin(params.isAdmin);
      }
      
      // Get the updated profile
      const updatedProfile = await getUserProfile();
      if (updatedProfile) {
        // Create a user object with the updated profile
        const updatedUser = {
          ...user,
          ...updatedProfile,
          isAdmin: params.isAdmin !== undefined ? params.isAdmin : isAdmin, // Use the new admin status if it was updated
          displayName: formData.displayName, // Ensure displayName is updated
          email: formData.email, // Ensure email is updated
          photoURL: formData.photoURL // Ensure photoURL is updated
        };
        
        // Update local user state
        setUser(updatedUser);
        
        // Update localStorage to ensure consistency
        const storedProfile = localStorage.getItem('userProfile');
        const profile = storedProfile ? JSON.parse(storedProfile) : {};
        const newProfile = {
          ...profile,
          ...updatedProfile,
          isAdmin: updatedUser.isAdmin,
          displayName: formData.displayName,
          email: formData.email,
          photoURL: formData.photoURL
        };
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
      }
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      
      <main className="flex-grow container py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPremium && (
              <Badge variant="default" className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm">
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
            )}
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Account Settings</CardTitle>
              <CardDescription>
                Update your profile information and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={previewPhotoURL || undefined} alt={formData.displayName} />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Change Photo
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={isLoading || isUploading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200px, max 2MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Leave these fields blank if you don't want to change your password
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Admin Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your account permissions
                  </p>

                  {/* Admin toggle for authorized users */}
                  {isAuthorizedAdmin && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <Label htmlFor="admin-toggle">Enable Admin</Label>
                        </div>
                        <Switch
                          id="admin-toggle"
                          checked={pendingAdminState}
                          onCheckedChange={handleAdminToggle}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enable admin privileges to unlock all features and content.
                        Changes will be applied when you save.
                      </p>
                    </div>
                  )}
                  
                  {/* Show current admin status to all users */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className={`h-5 w-5 ${isAdmin ? 'text-blue-500' : 'text-gray-400'}`} />
                        <Label>Current Admin Status</Label>
                      </div>
                      <span className={`text-sm font-medium ${isAdmin ? 'text-blue-500' : 'text-gray-500'}`}>
                        {isAdmin ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin 
                        ? 'You currently have admin privileges.' 
                        : 'You currently do not have admin privileges.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading || isUploading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Premium Payment History - Only visible to admins */}
          {isAdmin && (
            <PremiumPaymentHistory />
          )}
        </div>
      </main>
      
      <LandingFooter />
      
      {/* Image Editor */}
      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        onSave={handleSaveImage}
        imageDataURL={originalImage}
      />
    </div>
  );
} 