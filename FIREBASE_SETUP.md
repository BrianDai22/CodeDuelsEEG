# Firebase Authentication Setup

This document provides instructions for setting up Firebase Authentication for the Code Duels application.

## Prerequisites

- Node.js and npm/yarn installed
- A Firebase account (free tier is sufficient)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "code-duels")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Register Your Web App

1. In the Firebase Console, click on the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "code-duels-web")
3. Firebase will provide you with a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

## Step 3: Update Environment Variables

1. Copy the values from the Firebase configuration object
2. Update the `.env` file in the root of your project with these values:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## Step 4: Install Firebase Dependencies

Run the following command to install the required Firebase packages:

```bash
npm install firebase
# or
yarn add firebase
```

## Step 5: Enable Email/Password Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. Click "Save"

## Step 6: Set Up Realtime Database

1. In the Firebase Console, go to "Realtime Database" in the left sidebar
2. Click "Create database"
3. Choose a location for your database (choose the one closest to your users)
4. Start in test mode for development (you can change this later)
5. Click "Enable"

## Step 7: Set Up Database Security Rules

1. In the Realtime Database section, go to the "Rules" tab
2. Update the rules to allow authenticated users to read and write their own data:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

3. Click "Publish"

## Testing Your Setup

After completing these steps, you should be able to:

1. Sign up new users
2. Log in with existing users
3. Access user data from the Realtime Database
4. Log out users

If you encounter any issues, check the browser console for error messages.

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security) 