import { Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ProductFilters = ({ onFilterChange, onSortChange }) => {
  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: 1.5,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
      }}
    >
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel sx={{ fontSize: '0.875rem' }}>Sort by</InputLabel>
        <Select
          label="Sort by"
          defaultValue="popular"
          sx={{
            borderRadius: 1,
            fontSize: '0.875rem',
            bgcolor: 'background.paper',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
          }}
        >
          <MenuItem value="popular">Popular</MenuItem>
          <MenuItem value="price-low">Price: Low to High</MenuItem>
          <MenuItem value="price-high">Price: High to Low</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default ProductFilters;
