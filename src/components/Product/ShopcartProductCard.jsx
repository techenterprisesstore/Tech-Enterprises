import { Box, Typography, Button, IconButton, Chip, Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';
import { formatCurrency } from '../../utils/format';
import { useState } from 'react';

const ShopcartProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const isOutOfStock = product.stock === 0;
  const offerPrice = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
  const price = Number(product.price);
  const hasOffer = product.isOffer === true || (offerPrice != null && offerPrice > 0 && price > offerPrice);
  const discountPercent = hasOffer && price > 0
    ? Math.round(((price - offerPrice) / price) * 100)
    : 0;
  const hasReviews = typeof product.rating === 'number' && product.rating >= 0 && typeof product.totalReviews === 'number' && product.totalReviews > 0;
  const imageSrc = (product.galleryImages && product.galleryImages[0]) || product.imageUrl || '/placeholder.svg';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) navigate(`/product/${product.id}`);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': !isOutOfStock
          ? { borderColor: 'action.selected', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
          : {},
      }}
      onClick={() => !isOutOfStock && navigate(`/product/${product.id}`)}
    >
      {/* Square image box */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={product.name}
          onError={(e) => { e.target.src = '/placeholder.svg'; }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />

        <IconButton
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            bgcolor: 'rgba(255,255,255,0.9)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            '&:hover': { bgcolor: 'white' },
          }}
          onClick={handleFavorite}
        >
          {isFavorite ? (
            <HeroIcon name="favorite" size={18} color="error.main" solid />
          ) : (
            <HeroIcon name="favoriteBorder" size={18} color="text.secondary" />
          )}
        </IconButton>

        {hasOffer && (
          <Chip
            label={`${discountPercent}% off`}
            size="small"
            sx={{
              position: 'absolute',
              top: 6,
              left: 6,
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.6875rem',
              height: 20,
              '& .MuiChip-label': { px: 1 },
              borderRadius: 1,
            }}
          />
        )}

        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="white" fontWeight={600}>
              Out of stock
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mb: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            color: 'text.primary',
            fontSize: '0.875rem',
            lineHeight: 1.35,
          }}
        >
          {product.name}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            mb: 0.5,
          }}
        >
          {product.category || 'Electronics'}
        </Typography>

        {/* Reviews */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          {hasReviews ? (
            <>
              <Rating value={product.rating} readOnly size="small" precision={0.5} sx={{ '& .MuiRating-iconFilled': { color: '#ffc107' }, '& .MuiRating-icon': { fontSize: 12 } }} />
              <Typography variant="caption" color="text.secondary">
                ({product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'})
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No review
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1rem' }}>
              {hasOffer ? formatCurrency(product.offerPrice) : formatCurrency(product.price)}
            </Typography>
            {hasOffer && (
              <Typography component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: '0.75rem' }}>
                {formatCurrency(product.price)}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="small"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            startIcon={<HeroIcon name="shoppingCart" size={16} />}
            sx={{
              borderRadius: 1,
              py: 0.875,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.8125rem',
            }}
          >
            Add to cart
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ShopcartProductCard;
