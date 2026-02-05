import { Box, Typography } from '@mui/material';
import HeroIcon from './HeroIcon';

const EmptyState = ({ message = 'No items found', iconName = 'shoppingBag' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2
      }}
    >
      <HeroIcon name={iconName} size={64} color="text.secondary" sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default EmptyState;
