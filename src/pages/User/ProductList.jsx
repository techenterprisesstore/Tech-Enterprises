import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Button, Box } from '@mui/material';
import ShopcartProductCard from '../../components/Product/ShopcartProductCard';
import ProductSkeleton, { ProductGridSkeleton } from '../../components/Product/ProductSkeleton';
import ProductFilters from '../../components/Product/ProductFilters';
import EmptyState from '../../components/Common/EmptyState';
import { getProducts } from '../../services/productService';
import { PAGINATION_SIZE } from '../../utils/constants';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    loadProducts();
    // Clear cache on mount to ensure fresh data
    const { clearProductsCache } = require('../../services/productService');
    clearProductsCache();
  }, []);

  useEffect(() => {
    // Filter products by category
    if (selectedCategory === null) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    setLoading(true);
    console.log('Loading products...');
    const result = await getProducts(PAGINATION_SIZE);
    console.log('Products result:', result);
    
    if (result.success) {
      console.log(`Loaded ${result.products?.length || 0} products`);
      setProducts(result.products || []);
      setHasMore(result.hasMore || false);
      setLastDoc(result.lastDoc || null);
    } else {
      // If error, set empty products array
      console.error('Error loading products:', result.error);
      setProducts([]);
      setHasMore(false);
      // Show error to user
      alert(`Error loading products: ${result.error}. Please check browser console for details.`);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    const result = await getProducts(PAGINATION_SIZE, lastDoc);
    
    if (result.success) {
      setProducts([...products, ...result.products]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    }
    setLoadingMore(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 3 }}>
      <ProductFilters />
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 }, pt: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            mb: 1,
          }}
        >
          {selectedCategory ? selectedCategory : 'Products'}
        </Typography>
        <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary', mb: 3 }}>
          {selectedCategory ? `${selectedCategory} for you` : 'All products'}
        </Typography>

        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: PAGINATION_SIZE }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <ProductSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : filteredProducts.length === 0 ? (
          <EmptyState message="No products available" />
        ) : (
          <>
            <Grid container spacing={2}>
              {filteredProducts.map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <ShopcartProductCard product={product} />
                </Grid>
              ))}
            </Grid>
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={loadMore}
                  disabled={loadingMore}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default ProductList;
