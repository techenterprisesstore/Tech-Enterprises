import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Paper, Chip } from '@mui/material';
import { Tag, CheckCircle } from 'lucide-react';
import ShopcartProductCard from '../../components/Product/ShopcartProductCard';
import ProductSkeleton from '../../components/Product/ProductSkeleton';
import { getOfferProducts } from '../../services/productService';
import { getOffersForUser, getUserUsageForOffers } from '../../services/offerService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

const Offers = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [usageMap, setUsageMap] = useState({}); // { [offerId]: usedCount }
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
      setUsageMap({});
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
    if (result.success) {
      const offers = result.offers;
      setCoupons(offers);
      // Fetch this user's usage counts for all loaded offers
      const map = await getUserUsageForOffers(offers.map(o => o.id), user.uid);
      setUsageMap(map);
    }
    setCouponsLoading(false);
  };

  const discountLabel = (o) => {
    if (o.discountType === 'percent') return `${o.discountValue}% off`;
    return `${formatCurrency(Number(o.discountValue))} off`;
  };

  const isUsedUp = (c) => {
    const limit = Number(c.usageLimitPerUser) || 0;
    if (limit === 0) return false; // unlimited — never "used up"
    const used = usageMap[c.id] || 0;
    return used >= limit;
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

        {/* Your coupons */}
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
                {coupons.map((c) => {
                  const used = isUsedUp(c);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={c.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: used ? '#e2e8f0' : 'divider',
                          bgcolor: used ? '#f8fafc' : '#fff',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: used ? 0.75 : 1,
                        }}
                      >
                        {/* Used ribbon */}
                        {used && (
                          <Box sx={{
                            position: 'absolute', top: 10, right: -22,
                            bgcolor: '#22c55e', color: '#fff',
                            fontSize: '0.65rem', fontWeight: 700,
                            px: 3.5, py: 0.3,
                            transform: 'rotate(35deg)',
                            letterSpacing: '0.06em',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          }}>
                            USED
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Box sx={{
                            width: 44, height: 44, borderRadius: 2,
                            bgcolor: used ? '#94a3b8' : 'primary.main',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {used
                              ? <CheckCircle size={22} style={{ color: 'white' }} />
                              : <Tag size={22} style={{ color: 'white' }} />
                            }
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ color: used ? '#64748b' : 'text.primary' }}>
                              {c.name || c.code}
                            </Typography>
                            <Chip
                              label={discountLabel(c)}
                              size="small"
                              color={used ? 'default' : 'primary'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{
                          mt: 2, p: 1.5, borderRadius: 1,
                          bgcolor: used ? '#f1f5f9' : '#f8fafc',
                        }}>
                          {used ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <CheckCircle size={14} style={{ color: '#22c55e' }} />
                              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                                Already used
                              </Typography>
                            </Box>
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary">Use at checkout</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                                {c.code}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
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
