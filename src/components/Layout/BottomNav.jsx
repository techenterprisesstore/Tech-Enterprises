import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper, Box } from '@mui/material';
import HeroIcon from '../Common/HeroIcon';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(() => {
    const path = location.pathname;
    if (path === '/' || path === '/products' || path === '/checkout') return 0;
    if (path === '/offers') return 1;
    if (path === '/cart') return 2;
    if (path === '/orders') return 3;
    if (path === '/profile') return 4;
    return 0;
  });

  const handleChange = (event, newValue) => {
    setValue(newValue);
    const routes = ['/', '/offers', '/cart', '/orders', '/profile'];
    navigate(routes[newValue]);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/products' || path === '/checkout') setValue(0);
    else if (path === '/offers') setValue(1);
    else if (path === '/cart') setValue(2);
    else if (path === '/orders') setValue(3);
    else if (path === '/profile') setValue(4);
  }, [location.pathname]);

  const NavIcon = ({ name, selected }) => (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: selected ? 'rgba(46, 75, 247, 0.12)' : 'transparent',
      }}
    >
      <HeroIcon name={name} size={{ xs: 28, sm: 26 }} />
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: { xs: 'block', md: 'none' }, // Hide on desktop and tablet
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          height: { xs: 72, sm: 68 },
          bgcolor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: { xs: 70, sm: 60 },
            paddingTop: 0.5,
            paddingBottom: 0.5,
            color: 'text.secondary',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: { xs: '0.8125rem', sm: '0.75rem' },
            fontWeight: 500,
            mt: 0.5,
            transition: 'all 0.2s',
            '&.Mui-selected': {
              fontSize: { xs: '0.8125rem', sm: '0.75rem' },
              fontWeight: 700,
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<NavIcon name="home" selected={value === 0} />}
        />
        <BottomNavigationAction
          label="Offers"
          icon={<NavIcon name="offer" selected={value === 1} />}
        />
        <BottomNavigationAction
          label="Cart"
          icon={<NavIcon name="shoppingCart" selected={value === 2} />}
        />
        <BottomNavigationAction
          label="Orders"
          icon={<NavIcon name="orders" selected={value === 3} />}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<NavIcon name="person" selected={value === 4} />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
