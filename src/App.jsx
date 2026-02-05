import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { CartProvider } from './context/CartContext';
import AppLayout from './components/Layout/AppLayout';
import AdminLayout from './pages/Admin/AdminLayout';
import FirebaseConfigError from './components/Common/FirebaseConfigError';
import { auth } from './config/firebase';
import theme from './theme';

// User Pages
import Login from './pages/User/Login';
import Signup from './pages/User/Signup';
import Home from './pages/User/Home';
import ProductList from './pages/User/ProductList';
import ProductDetail from './pages/User/ProductDetail';
import Offers from './pages/User/Offers';
import OrderHistory from './pages/User/OrderHistory';
import Profile from './pages/User/Profile';
import Cart from './pages/User/Cart';
import Checkout from './pages/User/Checkout';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductManagement from './pages/Admin/ProductManagement';
import CategoryManagement from './pages/Admin/CategoryManagement';
import BannerManagement from './pages/Admin/BannerManagement';
import OrderManagement from './pages/Admin/OrderManagement';
import UserManagement from './pages/Admin/UserManagement';
import OfferManagement from './pages/Admin/OfferManagement';
import RatingManagement from './pages/Admin/RatingManagement';

function App() {
  // Check if Firebase is configured
  if (!auth) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FirebaseConfigError />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* User Routes */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route
            path="/products"
            element={
              <AppLayout>
                <ProductList />
              </AppLayout>
            }
          />
          <Route
            path="/offers"
            element={
              <AppLayout>
                <Offers />
              </AppLayout>
            }
          />
          <Route
            path="/product/:id"
            element={
              <AppLayout>
                <ProductDetail />
              </AppLayout>
            }
          />
          <Route
            path="/orders"
            element={
              <AppLayout>
                <OrderHistory />
              </AppLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppLayout>
                <Profile />
              </AppLayout>
            }
          />
          <Route
            path="/cart"
            element={
              <AppLayout>
                <Cart />
              </AppLayout>
            }
          />
          <Route
            path="/checkout"
            element={
              <AppLayout>
                <Checkout />
              </AppLayout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminLayout>
                <ProductManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminLayout>
                <CategoryManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <AdminLayout>
                <BannerManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminLayout>
                <OrderManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/offers"
            element={
              <AdminLayout>
                <OfferManagement />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/ratings"
            element={
              <AdminLayout>
                <RatingManagement />
              </AdminLayout>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
