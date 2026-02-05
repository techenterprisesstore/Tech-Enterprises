# Quick Setup Guide

## ✅ Fixed Issues

1. **Blank Page Issue** - Fixed Firebase initialization errors
2. **Login/Signup Pages** - Now properly accessible and working
3. **Route Protection** - Added proper authentication checks
4. **Error Handling** - Added graceful error handling throughout

## 🚀 How to Run

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create `.env` file** (already created from `.env.example`):
   ```bash
   # The .env file should contain your Firebase credentials
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - The app will be available at `http://localhost:3000`
   - You should see a welcome screen with Login/Signup buttons

## 📱 App Flow

### For New Users:
1. Visit `http://localhost:3000` → See welcome screen
2. Click "Sign Up" → Create account
3. After signup → Redirected to products page
4. Browse products → Click on product → View details → Buy via WhatsApp

### For Existing Users:
1. Visit `http://localhost:3000` → See welcome screen
2. Click "Login" → Enter credentials
3. After login → Redirected to products page

### Guest Access:
- Click "Continue as Guest" → Browse products without login
- Cannot place orders without login

## 🔧 Troubleshooting

### If you see a blank page:
1. Check browser console (F12) for errors
2. Verify `.env` file exists and has correct Firebase credentials
3. Restart the dev server: `npm run dev`

### If login/signup doesn't work:
1. Check Firebase Console → Authentication → Sign-in methods
2. Ensure Email/Password and Google are enabled
3. Check browser console for error messages

### If products don't load:
1. Check Firestore database has products collection
2. Verify Firestore security rules allow public read access
3. Check browser console for errors

## 📝 Next Steps

1. **Add Products**: Use Admin panel (after creating admin user)
2. **Create Admin User**: 
   - Sign up normally
   - In Firestore, change user's `role` field to `"admin"`
   - Access admin panel at `/admin`

## 🎯 Key Routes

- `/` - Home/Welcome page (or products if logged in)
- `/login` - Login page
- `/signup` - Sign up page
- `/products` - Product listing
- `/offers` - Special offers
- `/orders` - Order history (requires login)
- `/profile` - User profile (requires login)
- `/admin` - Admin dashboard (requires admin role)
