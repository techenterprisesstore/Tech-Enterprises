# Electronics E-Commerce Application

A material-minimal, app-like e-commerce web application for an electronics firm built with React, Firebase, and Material-UI.

## 🚀 Features

### User Features
- ✅ Material-style login/signup
- ✅ Google Sign-In integration
- ✅ Product listing with pagination
- ✅ Special offers section
- ✅ Product detail pages
- ✅ Buy via WhatsApp integration
- ✅ Order history
- ✅ User profile management

### Admin Features
- ✅ Admin-only dashboard with analytics
- ✅ Product CRUD operations
- ✅ Stock management
- ✅ Offer toggle functionality
- ✅ User management
- ✅ Order management and status updates

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **UI Framework**: Material-UI (MUI)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router v6
- **State Management**: React Hooks

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase project (Free Spark Plan)
- WhatsApp Business number

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Set up Firebase Storage
5. Copy your Firebase config from Project Settings

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WHATSAPP_NUMBER=1234567890
```

### 4. Firebase Security Rules

Deploy Firestore and Storage rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

Or manually copy the rules from:
- `firestore.rules`
- `storage.rules`

### 5. Firestore Indexes

Create the following composite indexes in Firestore:

1. **orders collection**:
   - Field: `userId` (Ascending)
   - Field: `createdAt` (Descending)

2. **products collection**:
   - Field: `isOffer` (Ascending)
   - Field: `createdAt` (Descending)

3. **products collection**:
   - Field: `category` (Ascending)
   - Field: `createdAt` (Descending)

Or deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

### 6. Create Admin User

1. Sign up a user through the app
2. In Firestore, manually change the user's `role` field from `"user"` to `"admin"`

## 🚀 Running the Application

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout/          # App layout components
│   ├── Product/         # Product-related components
│   └── Common/          # Common components
├── pages/               # Page components
│   ├── User/           # User-facing pages
│   └── Admin/          # Admin pages
├── services/            # Firebase service functions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── config/             # Configuration files
```

## 🔐 Security

- Role-based access control (RBAC)
- Firestore security rules
- Storage security rules
- Route protection at UI level
- Database-level authorization

## 📊 Database Structure

### Collections

**users**
```
{
  name: string,
  email: string,
  phone: string,
  role: "user" | "admin",
  provider: "email" | "google",
  createdAt: timestamp
}
```

**products**
```
{
  name: string,
  price: number,
  offerPrice: number | null,
  stock: number,
  category: string,
  imageUrl: string,
  isOffer: boolean,
  createdAt: timestamp
}
```

**orders**
```
{
  userId: string,
  items: [
    { productId: string, name: string, qty: number, price: number }
  ],
  totalAmount: number,
  status: "pending" | "confirmed",
  createdAt: timestamp
}
```

## 🎯 Optimization Features

- ✅ Client-side caching for products
- ✅ Pagination to limit reads
- ✅ Batch operations where possible
- ✅ Lazy loading for images
- ✅ Minimal API calls
- ✅ Optimized Firestore queries
- ✅ Indexed queries for performance

## 📱 WhatsApp Integration

Orders are automatically saved to Firestore and then redirected to WhatsApp Business with a pre-filled message containing order details.

## 🎨 UI/UX Features

- Material Design 3 principles
- Responsive design (mobile-first)
- Bottom navigation for mobile
- Skeleton loaders
- Empty states
- Smooth transitions
- App-like experience

## 📝 Notes

- The app is optimized for Firebase Free (Spark Plan) limits
- All operations are designed to minimize reads/writes
- Images should be compressed (≤300KB) before upload
- Admin access requires manual role update in Firestore

## 🐛 Troubleshooting

### Firebase Auth Errors
- Ensure Authentication is enabled in Firebase Console
- Check that Email/Password and Google providers are enabled

### Firestore Permission Errors
- Verify security rules are deployed correctly
- Check that indexes are created for composite queries

### Image Upload Issues
- Ensure Storage rules allow admin writes
- Check file size (should be ≤300KB)

## 📄 License

This project is created for educational/demonstration purposes.

## 👨‍💻 Development

Built with ❤️ using React, Firebase, and Material-UI.
