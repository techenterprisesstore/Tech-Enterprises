import { Box, Chip } from '@mui/material';
import { PRODUCT_CATEGORIES } from '../../utils/constants';

const CategoryChips = ({ selectedCategory, onCategoryChange }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        overflowX: 'auto',
        pb: 1.5,
        px: 2,
        pt: 1,
        bgcolor: 'background.default',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <Chip
        label="All"
        onClick={() => onCategoryChange(null)}
        sx={{
          bgcolor: selectedCategory === null ? 'primary.main' : 'background.paper',
          color: selectedCategory === null ? 'white' : 'text.primary',
          fontWeight: 600,
          fontSize: '0.875rem',
          px: 2,
          height: 36,
          cursor: 'pointer',
          border: selectedCategory === null ? 'none' : '1px solid',
          borderColor: 'divider',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: selectedCategory === null ? 'primary.dark' : 'action.hover',
            },
        }}
      />
      {PRODUCT_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={category}
          onClick={() => onCategoryChange(category)}
          sx={{
            bgcolor: selectedCategory === category ? 'primary.main' : 'background.paper',
            color: selectedCategory === category ? 'white' : 'text.primary',
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
            height: 36,
            cursor: 'pointer',
            border: selectedCategory === category ? 'none' : '1px solid',
            borderColor: 'divider',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: selectedCategory === category ? 'primary.dark' : 'action.hover',
            },
          }}
        />
      ))}
    </Box>
  );
};

export default CategoryChips;
