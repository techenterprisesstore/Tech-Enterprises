# How to Update User Roles

## Method 1: Using Admin Panel (Recommended)

1. **Login as Admin**
   - First, you need at least one admin user
   - If you don't have an admin yet, use Method 2 below to create the first admin

2. **Access Admin Panel**
   - Login to your account
   - Navigate to `/admin` or click "Admin Dashboard" from your profile
   - Go to "Users" section in the sidebar

3. **Update User Role**
   - Find the user you want to update (including Google login users)
   - Select the new role from the dropdown (User or Admin)
   - Click the save icon (💾) that appears next to the role
   - The role will be updated immediately

**Note:** You cannot change your own role while logged in.

## Method 2: Manual Update in Firestore (For First Admin)

If you don't have an admin user yet, you need to manually create one:

1. **Login with Google**
   - Go to your app and login with Google
   - This will create a user document in Firestore

2. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to **Firestore Database**

3. **Find Your User**
   - Open the `users` collection
   - Find the document with your email (the document ID is your user UID)

4. **Update Role Field**
   - Click on the user document
   - Find the `role` field
   - Change the value from `"user"` to `"admin"`
   - Click "Update"

5. **Refresh Your App**
   - Logout and login again
   - You should now have admin access
   - Navigate to `/admin` to access the admin panel

## Method 3: Using Firebase CLI (Advanced)

If you have Firebase CLI installed:

```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update user role using Firestore command
firebase firestore:set users/USER_ID {role: "admin"} --project YOUR_PROJECT_ID
```

Replace:
- `USER_ID` with the actual user document ID (Firebase Auth UID)
- `YOUR_PROJECT_ID` with your Firebase project ID

## Finding User ID (UID)

To find a user's UID:

1. **From Firebase Console:**
   - Go to Authentication → Users
   - Find the user by email
   - Copy the UID

2. **From Browser Console:**
   - Login to your app
   - Open browser console (F12)
   - Type: `firebase.auth().currentUser.uid` (if using Firebase SDK directly)
   - Or check the Network tab → Firestore requests → see the document IDs

## Important Notes

- **Google Login Users**: When users login with Google, they are automatically created with `role: "user"`. You need to manually update this to `"admin"` for the first admin, then use the admin panel for others.

- **Security**: Only users with `role: "admin"` can access the admin panel and update roles. Make sure your Firestore security rules are properly configured.

- **Cannot Change Own Role**: For security reasons, you cannot change your own role while logged in. Ask another admin to change it, or use Method 2.

## Quick Steps Summary

**First Time Setup:**
1. Login with Google → Creates user with role "user"
2. Go to Firestore → Find your user document
3. Change `role` from `"user"` to `"admin"`
4. Refresh app → You're now an admin!

**After First Admin:**
1. Login as admin
2. Go to Admin → Users
3. Select role from dropdown → Click save icon
4. Done!
