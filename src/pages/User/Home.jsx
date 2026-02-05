import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BlinkitProductCard from '../../components/Product/BlinkitProductCard';
import ProductSkeleton from '../../components/Product/ProductSkeleton';
import HeroBanner from '../../components/Promotional/HeroBanner';
import PopularCategories from '../../components/Category/PopularCategories';
import LoginModal from '../../components/Auth/LoginModal';
import HeroIcon from '../../components/Common/HeroIcon';
import { getProducts, getOfferProducts } from '../../services/productService';
import { PAGINATION_SIZE } from '../../utils/constants';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResult, offersResult] = await Promise.all([
        getProducts(PAGINATION_SIZE),
        getOfferProducts(),
      ]);
      if (productsResult.success) {
        setProducts(productsResult.products || []);
        setFilteredProducts(productsResult.products || []);
      }
      if (offersResult.success) {
        setOffers(offersResult.products || []);
      }
    } catch (error) {
      console.error('Home: Error loading data:', error);
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pt: 1, pb: 4 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ height: 140, bgcolor: '#f0f0f0', borderRadius: 2, mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1, overflow: 'hidden', mb: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#eee', flexShrink: 0 }} />
            ))}
          </Box>
          <Grid container spacing={1.5}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <ProductSkeleton />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (user) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 4 }}>
        <HeroBanner />
        <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <PopularCategories selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} />

          {offers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1.5, fontSize: '0.9375rem' }}>
                Best offers for you
              </Typography>
              <Grid container spacing={1.5}>
                {offers.slice(0, 8).map((product) => (
                  <Grid item xs={6} md={4} lg={3} key={product.id}>
                    <BlinkitProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1.5, fontSize: '0.9375rem' }}>
            {selectedCategory ? selectedCategory : 'All products'}
          </Typography>

          {filteredProducts.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                borderRadius: 2,
                bgcolor: '#fff',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <HeroIcon name="shoppingBag" size={40} color="text.secondary" sx={{ opacity: 0.5, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">No products found</Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {filteredProducts.map((product) => (
                <Grid item xs={6} md={4} lg={3} key={product.id}>
                  <BlinkitProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    );
  }

  // Guest landing – app-like CTA
  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
          background: 'linear-gradient(180deg, #2e4bf7 0%, #1e3aaf 100%)',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
          <Box
            component="img"
            src="/assets/secondarylogo.png"
            alt="Tech Enterprise"
            sx={{ height: { xs: 72, sm: 88 }, width: 'auto', mb: 2, mx: 'auto', display: 'block' }}
            onError={(e) => { e.target.src = '/assets/applogo.png'; }}
          />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem', mb: 2 }}>
            Electronics, delivered fast
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <HeroIcon name="shipping" size={22} color="white" />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Fast delivery</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <HeroIcon name="check" size={22} color="white" />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Quality assured</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <HeroIcon name="star" size={22} color="white" />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '0.75rem' }}>Best prices</Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => setLoginModalOpen(true)}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              py: 1.25,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' },
            }}
          >
            Get started
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem' }}>
            Sign in or create an account to browse and order
          </Typography>
        </Box>
      </Box>
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};

export default Home;
