import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { getCategories } from '../../services/categoryService';
import HeroIcon from '../Common/HeroIcon';

const categoryIcons = {
  'Smartphones': 'phone',
  'Laptops': 'laptop',
  'Tablets': 'tablet',
  'Headphones': 'headphones',
  'Speakers': 'speaker',
  'Smart Watches': 'watch',
  'Cameras': 'camera',
  'Accessories': 'shoppingBag',
  'Gaming': 'gaming',
  'Other': 'shoppingBag',
};

const PopularCategories = ({ selectedCategory, onCategorySelect }) => {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.success && result.categories?.length > 0) {
      setCategoryList(result.categories.map((c) => ({ name: c.name, imageUrl: c.imageUrl })));
    } else {
      setCategoryList([]);
    }
    setLoading(false);
  };

  const getIconName = (categoryName) => {
    return categoryIcons[categoryName] || 'shoppingBag';
  };

  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2.5,
          overflowX: 'auto',
          pb: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <Box
          onClick={() => onCategorySelect && onCategorySelect(null)}
          sx={{
            minWidth: 64,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            py: 0.5,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: selectedCategory === null ? 'primary.main' : '#f0f0f0',
              border: '2px solid',
              borderColor: selectedCategory === null ? 'primary.main' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <HeroIcon name="shoppingBag" size={26} color={selectedCategory === null ? 'white' : 'text.secondary'} />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: selectedCategory === null ? 'primary.main' : '#666', fontSize: '0.7rem' }}>
            All
          </Typography>
        </Box>
        {categoryList.map((item) => {
          const name = item.name;
          const imageUrl = item.imageUrl;
          const iconName = getIconName(name);
          const isSelected = selectedCategory === name;

          return (
            <Box
              key={name}
              onClick={() => onCategorySelect && onCategorySelect(name)}
              sx={{
                minWidth: 64,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                cursor: 'pointer',
                flexShrink: 0,
                py: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isSelected ? 'rgba(46, 75, 247, 0.12)' : '#f0f0f0',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {imageUrl ? (
                  <Box component="img" src={imageUrl} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <HeroIcon name={iconName} size={26} color={isSelected ? 'primary.main' : 'text.secondary'} />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: isSelected ? 'primary.main' : '#666',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 64,
                }}
              >
                {name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PopularCategories;
