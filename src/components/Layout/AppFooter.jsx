import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';

const footerLinks = {
  Shop: [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Offers', path: '/offers' },
  ],
  Account: [
    { label: 'My Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' },
  ],
  Legal: [
    { label: 'About Us', path: '/' },
    { label: 'Privacy', path: '/' },
    { label: 'Terms', path: '/' },
  ],
};

const AppFooter = () => {
  const navigate = useNavigate();

  const handleNav = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#0f172a',
        color: 'rgba(255,255,255,0.9)',
        mt: 'auto',
        // Reserve space for fixed bottom nav on mobile so footer doesn't sit under it
        pb: { xs: 10, md: 0 },
      }}
    >
      {/* Main footer content */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr 1fr', md: '1fr auto auto auto' },
            gridTemplateRows: { xs: 'auto auto', md: 'auto' },
            gap: { xs: 1.5, md: 4 },
            alignItems: { xs: 'flex-start', md: 'flex-start' },
            justifyContent: { xs: 'space-between', md: 'space-between' },
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          {/* Brand block - full width on mobile, first column on desktop */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: { xs: 0.5, md: 1 },
              mb: { xs: 0, md: 0 },
              pb: { xs: 1.5, md: 0 },
              borderBottom: { xs: '1px solid rgba(255,255,255,0.12)', md: 'none' },
            }}
          >
            <Box
              component="img"
              src="/assets/primarylogo.png"
              alt="Tech Enterprises"
              onError={(e) => {
                e.target.src = '/assets/applogo.png';
              }}
              sx={{
                height: { xs: 32, md: 40 },
                width: 'auto',
                
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 260,
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Quality tech, trusted by thousands. Shop the latest gadgets and accessories.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HeroIcon name="phoneCall" size={14} sx={{ color: 'primary.light' }} />
              <Typography component="a" href="tel:+001234567890" variant="body2" sx={{ color: 'inherit', textDecoration: 'none', fontSize: { xs: '0.8125rem', md: '0.875rem' } }}>
                +00 123 456 7890
              </Typography>
            </Box>
          </Box>

          {/* Link columns - side by side on mobile */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <Box
              key={heading}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'flex-start' },
                gap: { xs: 0.25, md: 1 },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.6875rem', md: '0.8125rem' },
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  mb: { xs: 0.25, md: 0.5 },
                }}
              >
                {heading}
              </Typography>
              {links.map(({ label, path }) => (
                <Link
                  key={path}
                  component="button"
                  variant="body2"
                  onClick={() => handleNav(path)}
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
                    '&:hover': { color: 'primary.light' },
                  }}
                >
                  {label}
                </Link>
              ))}
            </Box>
          ))}
        </Box>

        {/* Bottom bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pt: { xs: 2, md: 3 },
            mt: { xs: 2, md: 3 },
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            © {new Date().getFullYear()} Tech Enterprises. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              href="tel:+001234567890"
              sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'primary.light' } }}
              aria-label="Call"
            >
              <HeroIcon name="phoneCall" size={18} />
            </IconButton>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Secure payments · Fast delivery
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AppFooter;
