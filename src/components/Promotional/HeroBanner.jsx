import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HeroIcon from '../Common/HeroIcon';
import { getBanners } from '../../services/bannerService';

const AUTO_SCROLL_INTERVAL_MS = 5000;
// Mobile: 1920×1000, desktop: 1920×800
const BANNER_ASPECT_RATIO = { xs: '1920/800', sm: '1920/800' };
const BANNER_MAX_HEIGHT = { xs: 800, sm: 800 };

const HeroBanner = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getBanners();
      if (!cancelled && result.success && result.banners?.length > 0) {
        setBanners(result.banners || []);
        setCurrentIndex(0);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const goTo = useCallback((index, e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((i) => (index + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % banners.length);
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [banners.length]);

  const handleBannerClick = useCallback((b) => {
    if (!b?.link?.trim()) return;
    const href = b.link.trim();
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href.startsWith('/') ? href : `/${href}`);
    }
  }, [navigate]);

  if (loading || banners.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          aspectRatio: BANNER_ASPECT_RATIO,
          maxHeight: BANNER_MAX_HEIGHT,
          bgcolor: 'background.default',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #f0f2ff 0%, #e8ebff 50%, #f5f6ff 100%)',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HeroIcon name="camera" size={64} color="primary.main" sx={{ opacity: 0.3 }} />
      </Box>
    );
  }

  if (banners.length === 1) {
    const b = banners[0];
    const hasImage = b.imageUrl?.trim();
    return (
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          mb: 3,
          cursor: b.link?.trim() ? 'pointer' : 'default',
          overflow: 'hidden',
        }}
        onClick={() => handleBannerClick(b)}
        role={b.link?.trim() ? 'link' : undefined}
        aria-label={b.link?.trim() ? 'Banner link' : undefined}
      >
        {hasImage ? (
          <Box
            component="img"
            src={b.imageUrl}
            alt=""
            sx={{
              width: '100%',
              display: 'block',
              aspectRatio: BANNER_ASPECT_RATIO,
              maxHeight: BANNER_MAX_HEIGHT,
              objectFit: 'cover',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              aspectRatio: BANNER_ASPECT_RATIO,
              maxHeight: BANNER_MAX_HEIGHT,
              bgcolor: 'background.default',
              background: 'linear-gradient(145deg, #f0f2ff 0%, #e8ebff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeroIcon name="camera" size={64} color="primary.main" sx={{ opacity: 0.3 }} />
          </Box>
        )}
      </Box>
    );
  }

  const b = banners[currentIndex];
  const hasImage = b?.imageUrl?.trim();

  return (
    <Box sx={{ width: '100%', mb: 3, overflow: 'hidden' }}>
      <Box
        onClick={() => handleBannerClick(b)}
        sx={{
          width: '100%',
          cursor: b?.link?.trim() ? 'pointer' : 'default',
          display: 'block',
        }}
        role={b?.link?.trim() ? 'link' : undefined}
        aria-label={b?.link?.trim() ? 'Banner link' : undefined}
      >
        {hasImage ? (
          <Box
            component="img"
            src={b.imageUrl}
            alt=""
            sx={{
              width: '100%',
              display: 'block',
              aspectRatio: BANNER_ASPECT_RATIO,
              maxHeight: BANNER_MAX_HEIGHT,
              objectFit: 'cover',
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              aspectRatio: BANNER_ASPECT_RATIO,
              maxHeight: BANNER_MAX_HEIGHT,
              bgcolor: 'background.default',
              background: 'linear-gradient(145deg, #f0f2ff 0%, #e8ebff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeroIcon name="camera" size={64} color="primary.main" sx={{ opacity: 0.3 }} />
          </Box>
        )}
      </Box>

      {/* Dots outside image box */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          py: 1.5,
          bgcolor: 'background.paper',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {banners.map((_, i) => (
          <Box
            key={i}
            onClick={(e) => goTo(i, e)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: currentIndex === i ? 'primary.main' : 'action.selected',
              cursor: 'pointer',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </Box>
    </Box>
  );
};

export default HeroBanner;
