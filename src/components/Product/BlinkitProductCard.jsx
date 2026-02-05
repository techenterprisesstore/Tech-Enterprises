import { Box, Typography, Chip, Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

const BlinkitProductCard = ({ product }) => {
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0;
  const offerPrice = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
  const price = Number(product.price);
  const hasOffer = product.isOffer === true || (offerPrice != null && offerPrice > 0 && price > offerPrice);
  const discountPercent = hasOffer && price > 0
    ? Math.round(((price - offerPrice) / price) * 100)
    : 0;
  const hasReviews = typeof product.rating === 'number' && product.rating >= 0 && typeof product.totalReviews === 'number' && product.totalReviews > 0;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
      onClick={() => !isOutOfStock && navigate(`/product/${product.id}`)}
    >
      {/* Product Image */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '100%', // Square aspect ratio
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={product.imageUrl || '/placeholder.svg'}
          alt={product.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        {hasOffer && (
          <Chip
            label={`${discountPercent}% OFF`}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              height: 24,
              px: 1,
              borderRadius: 1,
            }}
          />
        )}
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="white" fontWeight="bold">
              Out of Stock
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Info */}
      <Box sx={{ p: 1.25 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.35,
            minHeight: 36,
            color: 'text.primary',
            fontSize: '0.875rem',
          }}
        >
          {product.name}
        </Typography>

        {/* Reviews */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          {hasReviews ? (
            <>
              <Rating value={product.rating} readOnly size="small" precision={0.5} sx={{ '& .MuiRating-iconFilled': { color: '#ffc107' }, '& .MuiRating-icon': { fontSize: 14 } }} />
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

        {/* Price – offer and actual in one row, actual to the right */}
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          {hasOffer ? (
            <>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: '1.125rem',
                  lineHeight: 1.2,
                }}
              >
                {formatCurrency(product.offerPrice)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                }}
              >
                {formatCurrency(product.price)}
              </Typography>
            </>
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '1.125rem',
                lineHeight: 1.2,
              }}
            >
              {formatCurrency(product.price)}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BlinkitProductCard;
