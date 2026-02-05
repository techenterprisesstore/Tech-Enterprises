import { Box } from '@mui/material';
import BottomNav from './BottomNav';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AppLayout = ({ children, onSearch }) => {
  const location = useLocation();
  const { user } = useAuth();
  const hideBottomNav = ['/login', '/signup', '/admin'].some(path => 
    location.pathname.startsWith(path)
  );
  const hideHeader = ['/login', '/signup', '/admin'].some(path => 
    location.pathname.startsWith(path)
  );
  // Hide header on home page when user is not logged in (landing page)
  const isLandingPage = location.pathname === '/' && !user;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {!hideHeader && !isLandingPage && <AppHeader onSearch={onSearch} />}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>
      {/* Show footer on all pages except login/signup/admin */}
      {!hideHeader && !isLandingPage && <AppFooter />}
      {!hideBottomNav && !isLandingPage && <BottomNav />}
    </Box>
  );
};

export default AppLayout;
