import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';

const PromotionalBanner = () => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        mx: { xs: 1, sm: 2 },
        mb: 3,
        borderRadius: 1,
        background: 'linear-gradient(135deg, #2e4bf7 0%, #1e35c4 100%)',
        p: 3,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <HeroIcon name="offer" size={32} />
          <Typography variant="h5" fontWeight="bold">
            Special Offers
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
          Get amazing deals on premium electronics. Limited time only!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/offers')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 700,
            borderRadius: 1,
            px: 3,
            py: 1,
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          Shop Now
        </Button>
      </Box>
    </Paper>
  );
};

export default PromotionalBanner;
