import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Paper, Chip } from '@mui/material';
import { Tag } from 'lucide-react';
import ShopcartProductCard from '../../components/Product/ShopcartProductCard';
import ProductSkeleton from '../../components/Product/ProductSkeleton';
import { getOfferProducts } from '../../services/productService';
import { getOffersForUser } from '../../services/offerService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

const Offers = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadCoupons();
    } else {
      setCoupons([]);
      setCouponsLoading(false);
    }
  }, [user?.uid]);

  const loadOffers = async () => {
    setLoading(true);
    const result = await getOfferProducts();
    if (result.success) setProducts(result.products);
    setLoading(false);
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    const result = await getOffersForUser(user.uid);
    if (result.success) setCoupons(result.offers);
    setCouponsLoading(false);
  };

  const discountLabel = (o) => {
    if (o.discountType === 'percent') return `${o.discountValue}% off`;
    return `${formatCurrency(Number(o.discountValue))} off`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 3 }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 }, pt: 2 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
          Deals
        </Typography>
        <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary', mb: 3 }}>
          Special offers
        </Typography>

        {/* Your coupons - only for logged-in users; shows offers targeted to them */}
        {user && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Your coupons</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use these codes at checkout to get a discount. Only you (and other selected users) can use each code.
            </Typography>
            {couponsLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper sx={{ p: 2, borderRadius: 2, height: 120 }} />
                  </Grid>
                ))}
              </Grid>
            ) : coupons.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No coupon offers for you right now. Check back later!</Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {coupons.map((c) => (
                  <Grid item xs={12} sm={6} md={4} key={c.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: '#fff',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tag size={22} style={{ color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{c.name || c.code}</Typography>
                          <Chip label={discountLabel(c)} size="small" color="primary" sx={{ mt: 0.5 }} />
                        </Box>
                      </Box>
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Use at checkout</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>{c.code}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Products on offer */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Products on offer</Typography>
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <ProductSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">No products on offer right now</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={6} sm={4} md={3} key={product.id}>
                <ShopcartProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Offers;
