import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Skeleton } from '@mui/material';
import HeroIcon from '../Common/HeroIcon';
import { getOfferProducts } from '../../services/productService';
import { useLocationDetection } from '../../hooks/useLocationDetection';

const OFFER_ROTATE_MS = 2000;

const TopBar = () => {
  const navigate = useNavigate();
  const [offerProducts, setOfferProducts] = useState([]);
  const [offerIndex, setOfferIndex] = useState(0);
  const { location, loading: locationLoading } = useLocationDetection();

  useEffect(() => {
    let cancelled = false;
    getOfferProducts().then((res) => {
      if (!cancelled && res.success && res.products?.length > 0) {
        setOfferProducts(res.products);
        setOfferIndex(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (offerProducts.length <= 1) return;
    const id = setInterval(() => {
      setOfferIndex((i) => (i + 1) % offerProducts.length);
    }, OFFER_ROTATE_MS);
    return () => clearInterval(id);
  }, [offerProducts.length]);

  const offerProduct = offerProducts[offerIndex] ?? offerProducts[0] ?? null;
  const mobileShortTitle = offerProduct?.name
    ? offerProduct.name.length > 20
      ? `${offerProduct.name.slice(0, 20)}…`
      : offerProduct.name
    : '';

  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        px: { xs: 1, sm: 1.5, md: 3 },
        py: { xs: 0.5, sm: 0.75, md: 1 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
      }}
    >
      {/* Left: Mobile = offer product | Desktop = contact */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.75, md: 1 },
          minWidth: 0,
          flex: { xs: '1 1 auto', md: '0 0 auto' },
        }}
      >
        {/* Mobile: offer image + short title */}
        {offerProduct && (
          <Box
            onClick={() => navigate(`/product/${offerProduct.id}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              borderRadius: 1,
              px: 0.75,
              py: 0.35,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              maxWidth: '100%',
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0.75,
                overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src={offerProduct.imageUrl || '/placeholder.svg'}
                alt={offerProduct.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/placeholder.svg';
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
              }}
            >
              {mobileShortTitle}
            </Typography>
          </Box>
        )}
        {!offerProduct && (
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Offers
          </Typography>
        )}
      </Box>

      {/* Spacer so location stays right */}
      <Box sx={{ flex: 1, minWidth: 0 }} />

      {/* Right: Location */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 0, maxWidth: { xs: 120, md: 220 } }}>
        <HeroIcon name="location" size={14} sx={{ flexShrink: 0, opacity: 0.9, display: { xs: 'block', md: 'block' } }} />
        <Box sx={{ ml: 0.5, minWidth: 0 }}>
          {locationLoading ? (
            <Skeleton
              variant="text"
              width={60}
              height={16}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.6875rem', md: '0.8125rem' },
              }}
              title={location?.display}
            >
              {location?.display || 'Location'}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TopBar;
