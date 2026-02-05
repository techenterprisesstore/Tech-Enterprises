import { Card, CardContent, CardMedia, Typography, Box, Chip, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';
import { formatCurrency } from '../../utils/format';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0;
  const hasOffer = product.isOffer && product.offerPrice;
  const discountPercent = hasOffer 
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : 0;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
        }
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={product.imageUrl || '/placeholder.svg'}
          alt={product.name}
          sx={{ 
            objectFit: 'cover',
            bgcolor: 'background.default'
          }}
        />
        {hasOffer && (
          <Chip
            label={`${discountPercent}% off`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'error.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
              borderRadius: 1
            }}
          />
        )}
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.9)',
            width: 36,
            height: 36,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,1)',
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Handle favorite logic here
          }}
        >
          <HeroIcon name="favoriteBorder" size={20} color="text.primary" />
        </IconButton>
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
              borderRadius: '8px 8px 0 0'
            }}
          >
            <Typography variant="body1" color="white" fontWeight="bold">
              OUT OF STOCK
            </Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography 
          variant="body1" 
          fontWeight="600" 
          gutterBottom 
          sx={{ 
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
            minHeight: 40
          }}
        >
          {product.name}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mb: 1.5, fontSize: '0.75rem' }}
        >
          {product.category}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
            {hasOffer ? (
              <>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatCurrency(product.offerPrice)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ 
                    textDecoration: 'line-through', 
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  {formatCurrency(product.price)}
                </Typography>
              </>
            ) : (
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(product.price)}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
