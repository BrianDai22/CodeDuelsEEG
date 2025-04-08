interface UpdateUserProfileParams {
  photoURL?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
}

// List of authorized admin emails
export const AUTHORIZED_ADMIN_EMAILS = [
  'admin@example.com',
  'brian@example.com',
  'support@example.com',
  'mooprules@gmail.com'
];

// List of authorized premium emails
export const AUTHORIZED_PREMIUM_EMAILS = [
  'premium@example.com',
  'vip@example.com',
  'test@example.com',
  'brian.dai239@gmail.com'
];

// Store for all user profiles to check uniqueness
let allUserProfiles: {
  photoURL?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
}[] = [];

// Store for premium payment records
let premiumPayments: {
  userId: string;
  email: string;
  sessionId: string;
  paymentDate: string;
  amount: number;
}[] = [];

// Check if an email is a guest email
function isGuestEmail(email: string): boolean {
  return email.includes('guest') || email.includes('anonymous') || email.includes('temp');
}

// Helper function to get profile from localStorage
function getUserProfileFromStorage(): {
  photoURL?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
} {
  const storedProfile = localStorage.getItem('userProfile');
  const guestUser = localStorage.getItem('guestUser');
  
  console.log('Getting user profile from storage:', { storedProfile, guestUser });
  
  // If there's a guest user, they can never be premium
  if (guestUser) {
    console.log('Guest user detected, returning non-premium profile');
    return {
      photoURL: '',
      displayName: '',
      email: '',
      isAdmin: false,
      isPremium: false
    };
  }
  
  if (storedProfile) {
    const profile = JSON.parse(storedProfile);
    console.log('Parsed stored profile:', profile);
    
    // Guest users cannot have admin or premium access
    if (profile.email && isGuestEmail(profile.email)) {
      console.log('Guest email detected, setting non-premium status');
      profile.isAdmin = false;
      profile.isPremium = false;
    } else {
      // Only check admin status if it's not explicitly set in the profile
      if (profile.isAdmin === undefined) {
        // Only grant admin access to authorized emails
        if (AUTHORIZED_ADMIN_EMAILS.includes(profile.email)) {
          console.log('Authorized admin email detected, granting admin access');
          profile.isAdmin = true;
        } else {
          console.log('Unauthorized admin email, removing admin status');
          profile.isAdmin = false;
        }
      }
      
      // Check if user should have premium access
      if (AUTHORIZED_PREMIUM_EMAILS.includes(profile.email)) {
        console.log('Authorized premium email detected, granting premium access');
        profile.isPremium = true;
      }
      
      // Ensure admin users always have premium access
      if (profile.isAdmin) {
        console.log('Admin user detected, ensuring premium access');
        profile.isPremium = true;
      }
    }
    
    console.log('Returning final profile:', profile);
    return profile;
  }
  
  console.log('No stored profile found, returning default profile');
  return {
    photoURL: '',
    displayName: '',
    email: '',
    isAdmin: false,
    isPremium: false
  };
}

// Helper function to load all user profiles
function loadAllUserProfiles(): void {
  const storedProfiles = localStorage.getItem('allUserProfiles');
  if (storedProfiles) {
    allUserProfiles = JSON.parse(storedProfiles);
  }
}

// Helper function to save all user profiles
function saveAllUserProfiles(): void {
  localStorage.setItem('allUserProfiles', JSON.stringify(allUserProfiles));
}

// Helper function to check if a display name is already taken
function isDisplayNameTaken(displayName: string, currentEmail?: string): boolean {
  return allUserProfiles.some(profile => 
    profile.displayName === displayName && profile.email !== currentEmail
  );
}

// Helper function to check if an email is already taken
function isEmailTaken(email: string): boolean {
  return allUserProfiles.some(profile => profile.email === email);
}

// Helper function to load premium payments
function loadPremiumPayments(): void {
  const storedPayments = localStorage.getItem('premiumPayments');
  if (storedPayments) {
    premiumPayments = JSON.parse(storedPayments);
  }
}

// Helper function to save premium payments
function savePremiumPayments(): void {
  localStorage.setItem('premiumPayments', JSON.stringify(premiumPayments));
}

// Initialize profiles on module load
loadAllUserProfiles();
loadPremiumPayments();

// Mock implementation using localStorage
export const updateUserProfile = async (params: UpdateUserProfileParams): Promise<void> => {
  console.log('Updating user profile with params:', params);
  
  // Check if user is a guest
  const guestUser = localStorage.getItem('guestUser');
  if (guestUser) {
    console.log('Guest user detected, preventing profile update');
    throw new Error('Guest users cannot update their profile');
  }
  
  // Get current profile from localStorage
  const currentProfile = getUserProfileFromStorage();
  console.log('Current profile:', currentProfile);
  
  // Check for uniqueness if display name or email is being updated
  if (params.displayName && params.displayName !== currentProfile.displayName) {
    console.log('Checking if display name is taken:', params.displayName);
    if (isDisplayNameTaken(params.displayName, currentProfile.email)) {
      console.log('Display name is already taken:', params.displayName);
      throw new Error('Display name is already taken by another user');
    }
  }
  
  if (params.email && params.email !== currentProfile.email) {
    console.log('Checking if email is taken:', params.email);
    if (isEmailTaken(params.email)) {
      console.log('Email is already taken:', params.email);
      throw new Error('Email is already taken by another user');
    }
  }
  
  // Update with new params, ensuring photoURL is properly handled
  const updatedProfile = {
    ...currentProfile,
    ...params,
    photoURL: params.photoURL || currentProfile.photoURL || ''
  };
  console.log('Updated profile before checks:', updatedProfile);

  // Guest users cannot have admin or premium access
  if (updatedProfile.email && isGuestEmail(updatedProfile.email)) {
    console.log('Guest email detected, removing admin and premium status');
    updatedProfile.isAdmin = false;
    updatedProfile.isPremium = false;
  } else {
    // Only allow admin access for authorized emails
    if (updatedProfile.isAdmin && !AUTHORIZED_ADMIN_EMAILS.includes(updatedProfile.email || '')) {
      console.log('Unauthorized admin email, removing admin status');
      updatedProfile.isAdmin = false;
    }

    // Check if user should have premium access
    if (AUTHORIZED_PREMIUM_EMAILS.includes(updatedProfile.email || '')) {
      console.log('Authorized premium email detected, granting premium access');
      updatedProfile.isPremium = true;
    }
    
    // Ensure admin users always have premium access
    if (updatedProfile.isAdmin) {
      console.log('Admin user detected, ensuring premium access');
      updatedProfile.isPremium = true;
    }
  }
  
  console.log('Final updated profile:', updatedProfile);

  // Save to localStorage
  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
  
  // Update the all profiles list
  const existingIndex = allUserProfiles.findIndex(p => p.email === currentProfile.email);
  if (existingIndex >= 0) {
    allUserProfiles[existingIndex] = updatedProfile;
  } else {
    allUserProfiles.push(updatedProfile);
  }
  saveAllUserProfiles();
  
  console.log('Profile updated successfully:', updatedProfile);
};

export async function getUserProfile(): Promise<{
  photoURL?: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
}> {
  try {
    return getUserProfileFromStorage();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function createUserProfile(params: {
  photoURL?: string;
  displayName: string;
  email: string;
}): Promise<void> {
  try {
    // Check if display name is already taken
    if (isDisplayNameTaken(params.displayName)) {
      throw new Error('Display name is already taken');
    }
    
    // Check if email is already taken
    if (isEmailTaken(params.email)) {
      throw new Error('Email is already taken');
    }
    
    // Create new profile
    const newProfile = {
      ...params,
      isAdmin: !isGuestEmail(params.email) && AUTHORIZED_ADMIN_EMAILS.includes(params.email),
      isPremium: !isGuestEmail(params.email) && (AUTHORIZED_ADMIN_EMAILS.includes(params.email) || AUTHORIZED_PREMIUM_EMAILS.includes(params.email))
    };
    
    // Save to localStorage
    localStorage.setItem('userProfile', JSON.stringify(newProfile));
    
    // Add to all profiles list
    allUserProfiles.push(newProfile);
    saveAllUserProfiles();
    
    console.log('User profile created successfully:', newProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Function to verify premium payment and update user status
export async function verifyPremiumPayment(sessionId: string, userId: string, email: string): Promise<boolean> {
  try {
    // Check if this session ID has already been processed
    const existingPayment = premiumPayments.find(payment => payment.sessionId === sessionId);
    if (existingPayment) {
      console.log('Payment already processed:', existingPayment);
      return true;
    }
    
    // Check if user is in the authorized premium emails list
    if (AUTHORIZED_PREMIUM_EMAILS.includes(email)) {
      console.log('User is in authorized premium emails list, granting premium access');
      
      // Add payment record for tracking
      const payment = {
        userId,
        email,
        sessionId: 'authorized_email',
        paymentDate: new Date().toISOString(),
        amount: 0 // No payment required for authorized emails
      };
      
      premiumPayments.push(payment);
      savePremiumPayments();
      
      // Update user profile to premium
      const userProfile = getUserProfileFromStorage();
      userProfile.isPremium = true;
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      // Update the all profiles list
      const existingIndex = allUserProfiles.findIndex(p => p.email === email);
      if (existingIndex >= 0) {
        allUserProfiles[existingIndex] = userProfile;
      }
      saveAllUserProfiles();
      
      return true;
    }
    
    // For non-authorized emails, proceed with normal payment verification
    // In a real application, you would verify the payment with Stripe here
    // For this mock implementation, we'll just add the payment to our records
    
    // Add payment record
    const payment = {
      userId,
      email,
      sessionId,
      paymentDate: new Date().toISOString(),
      amount: 5.00 // Mock amount
    };
    
    premiumPayments.push(payment);
    savePremiumPayments();
    
    // Update user profile to premium
    const userProfile = getUserProfileFromStorage();
    userProfile.isPremium = true;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Update the all profiles list
    const existingIndex = allUserProfiles.findIndex(p => p.email === email);
    if (existingIndex >= 0) {
      allUserProfiles[existingIndex] = userProfile;
    }
    saveAllUserProfiles();
    
    console.log('Premium payment verified and user status updated:', payment);
    return true;
  } catch (error) {
    console.error('Error verifying premium payment:', error);
    return false;
  }
}

// Function to get premium payment history
export async function getPremiumPaymentHistory(): Promise<{
  userId: string;
  email: string;
  sessionId: string;
  paymentDate: string;
  amount: number;
}[]> {
  return premiumPayments;
} 