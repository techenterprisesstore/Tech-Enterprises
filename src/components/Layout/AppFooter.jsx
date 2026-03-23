import { Box, Container, Typography, Link, IconButton, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';
import { MapPin, ShieldCheck } from 'lucide-react';

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

// ─── Mobile / Tablet footer (Blinkit-inspired) ────────────────────────────────
const MobileFooter = ({ navigate }) => (
  <Box
    component="footer"
    sx={{
      display: { xs: 'block', md: 'none' },
      bgcolor: '#f8f9fa',
      // Extra bottom padding so it clears the fixed BottomNav
      pb: 12,
      pt: 4,
      overflowX: 'hidden',
    }}
  >
    {/* Big watermark tagline */}
    <Box sx={{ px: 2.5, mb: 3 }}>
      <Typography
        sx={{
          fontSize: { xs: '2.75rem', sm: '3.5rem' },
          fontWeight: 800,
          lineHeight: 1.12,
          color: '#c8ccd8',
          letterSpacing: '-0.5px',
          userSelect: 'none',
        }}
      >
        India's trusted
        <br />
        tech store&nbsp;
        <Box component="span" sx={{ fontSize: '0.75em' }}>❤️</Box>
      </Typography>
    </Box>

    <Divider sx={{ borderColor: '#dde0e8', mx: 2.5 }} />

    {/* Logo + copyright */}
    <Box sx={{ px: 2.5, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box
        component="img"
        src="/assets/primarylogo.png"
        alt="Tech Enterprises"
        onError={(e) => { e.target.src = '/assets/applogo.png'; }}
        sx={{ height: 28, width: 'auto', filter: 'grayscale(1) opacity(0.45)', alignSelf: 'flex-start' }}
      />

      {/* Quick links row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', mt: 0.5 }}>
        {Object.values(footerLinks).flat().map(({ label, path }) => (
          <Link
            key={label}
            component="button"
            onClick={() => { navigate(path); window.scrollTo(0, 0); }}
            sx={{
              color: '#8a8fa8',
              fontSize: '0.78rem',
              fontWeight: 500,
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              p: 0,
              '&:hover': { color: 'primary.main' },
            }}
          >
            {label}
          </Link>
        ))}
      </Box>

      <Typography variant="caption" sx={{ color: '#aeb2c2', mt: 0.5, fontSize: '0.72rem' }}>
        © {new Date().getFullYear()} Tech Enterprises · Secure payments · Fast delivery
      </Typography>
    </Box>
  </Box>
);

// ─── Desktop footer (existing dark design) ────────────────────────────────────
const DesktopFooter = ({ navigate }) => (
  <Box
    component="footer"
    sx={{
      display: { xs: 'none', md: 'block' },
      bgcolor: '#0f172a',
      color: 'rgba(255,255,255,0.9)',
      mt: 'auto',
    }}
  >
    <Container maxWidth="lg" sx={{ py: 4, px: { sm: 3 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: 4,
          alignItems: 'flex-start',
        }}
      >
        {/* Brand block */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            component="img"
            src="/assets/primarylogo.png"
            alt="Tech Enterprises"
            onError={(e) => { e.target.src = '/assets/applogo.png'; }}
            sx={{ height: 40, width: 150 }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 260 }}>
            Quality tech, trusted by thousands. Shop the latest gadgets and accessories.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HeroIcon name="phoneCall" size={14} sx={{ color: 'primary.light' }} />
            <Typography variant="body2" sx={{ color: 'inherit', textDecoration: 'none' }}>
              +91 9140871592
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MapPin size={14} />
            <Typography variant="body2" sx={{ color: 'inherit', textDecoration: 'none' }}>
              63E/9 Dabauli Kanpur
            </Typography>
          </Box>
        </Box>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([heading, links]) => (
          <Box key={heading} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'white', fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}
            >
              {heading}
            </Typography>
            {links.map(({ label, path }) => (
              <Link
                key={path}
                component="button"
                variant="body2"
                onClick={() => { navigate(path); window.scrollTo(0, 0); }}
                sx={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', cursor: 'pointer', '&:hover': { color: 'primary.light' } }}
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
          pt: 3,
          mt: 3,
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} Tech Enterprises. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <IconButton size="small" sx={{ color: 'rgba(0, 255, 119, 0.7)' }}>
            <ShieldCheck size={18} />
          </IconButton>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Secure payments · Fast delivery
          </Typography>
        </Box>
      </Box>
    </Container>
  </Box>
);

// ─── Combined export ───────────────────────────────────────────────────────────
const AppFooter = () => {
  const navigate = useNavigate();
  return (
    <>
      <MobileFooter navigate={navigate} />
      <DesktopFooter navigate={navigate} />
    </>
  );
};

export default AppFooter;
