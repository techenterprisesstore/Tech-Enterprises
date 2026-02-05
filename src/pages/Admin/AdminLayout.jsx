import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import HeroIcon from '../../components/Common/HeroIcon';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { text: 'Products', icon: 'inventory', path: '/admin/products' },
  { text: 'Categories', icon: 'localOffer', path: '/admin/categories' },
  { text: 'Banners', icon: 'camera', path: '/admin/banners' },
  { text: 'Orders', icon: 'shoppingBag', path: '/admin/orders' },
  { text: 'Users', icon: 'people', path: '/admin/users' },
  { text: 'Offers', icon: 'localOffer', path: '/admin/offers' },
  { text: 'Ratings', icon: 'star', path: '/admin/ratings' },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      <Toolbar sx={{ minHeight: 64, px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src="/assets/primarylogo.png" alt="Logo" sx={{ height: 28, width: 'auto' }} onError={(e) => { e.target.src = '/assets/applogo.png'; }} />
        <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1.5, color: 'text.primary' }}>Admin</Typography>
      </Toolbar>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 15, fontWeight: 600 }}>
            {(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{profile?.name || user?.email?.split('@')[0] || 'Admin'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>Administrator</Typography>
          </Box>
        </Box>
      </Box>
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'white' : 'text.secondary' }}>
                  <HeroIcon name={item.icon} size={20} />
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton onClick={() => navigate('/')} sx={{ borderRadius: 2, py: 1.25, px: 2 }}>
          <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}><HeroIcon name="home" size={20} /></ListItemIcon>
          <ListItemText primary="Back to store" primaryTypographyProps={{ fontSize: '0.875rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafafa' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: '#fff',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: { xs: 'block', md: 'none' },
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56 }}>
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <HeroIcon name="menu" size={24} />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">Admin</Typography>
            <IconButton onClick={() => navigate('/')}><HeroIcon name="home" size={22} /></IconButton>
          </Toolbar>
        </AppBar>

        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
              top: 0,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', pt: { xs: 7, md: 0 } }}>
          {children}
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default AdminLayout;
