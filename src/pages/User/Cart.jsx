import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  TextField,
  Grid,
  Divider,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

const Cart = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    items, 
    totalItems, 
    totalPrice, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    loading 
  } = useCart();
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Listen for snackbar events
    const handleSnackbar = (event) => {
      setSnackbar({
        open: true,
        message: event.detail.message,
        severity: event.detail.severity,
      });
    };

    window.addEventListener('showSnackbar', handleSnackbar);
    return () => window.removeEventListener('showSnackbar', handleSnackbar);
  }, []);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }
    
    if (items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Your cart is empty',
        severity: 'error',
      });
      return;
    }
    
    // Use React Router navigation with proper error handling
    try {
      navigate('/checkout');
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback to window.location
      window.location.href = '/checkout';
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 320 }}>
          <ShoppingBag size={48} style={{ color: '#9ca3af', marginBottom: 16 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>Cart is empty</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Add items from the shop to get started</Typography>
          <Button variant="contained" startIcon={<ArrowLeft size={18} />} onClick={handleContinueShopping} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
            Continue shopping
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 3 }}>
      <Container maxWidth="md" sx={{ py: 2, px: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} size="small"><ArrowLeft size={20} /></IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>Cart ({totalItems})</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            {items.map((item, index) => (
              <Box key={item.id}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Grid Layout for Mobile */}
                  <Box sx={{ display: { xs: 'grid', sm: 'flex' }, gridTemplateColumns: '100px 1fr', gap: 2, alignItems: 'start' }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0, bgcolor: '#f5f5f5' }}>
                      <Box component="img" src={item.imageUrl || '/placeholder.svg'} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </Box>

                    {/* Product Details - Right Side */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Category - Top */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item.category || 'Product'}
                      </Typography>
                      
                      {/* Title - Middle (max 2 lines) */}
                      <Typography 
                        variant="h6" 
                        fontWeight={600} 
                        sx={{ 
                          mb: 2,
                          fontSize: { xs: '0.95rem', sm: '1.1rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.name}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bottom Row - Price, Quantity, Delete */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 2,
                    gap: 1,
                    flexWrap: 'wrap'
                  }}>
                    {/* Price - Left */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main' }}>
                        {formatCurrency(item.isOffer && item.offerPrice ? item.offerPrice : item.price)}
                      </Typography>
                      {item.isOffer && item.offerPrice && (
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration: 'line-through',
                            color: '#999',
                          }}
                        >
                          {formatCurrency(item.price)}
                        </Typography>
                      )}
                    </Box>

                    {/* Quantity Controls - Middle */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        size="small"
                        sx={{
                          border: '1px solid',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'rgba(46, 75, 247, 0.1)' },
                          width: 32,
                          height: 32,
                        
                        }}
                      >
                        <Minus size={14} />
                      </IconButton>
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          handleQuantityChange(item.id, value);
                        }}
                        inputProps={{ min: 1, max: item.stock }}
                        sx={{
                          width: 50,
                          '& .MuiOutlinedInput-root': {
                            textAlign: 'center',
                            '& fieldset': { borderColor: 'primary.main' },
                          },
                        }}
                        size="small"
                      />
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        size="small"
                        sx={{
                          border: '1px solid',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'rgba(46, 75, 247, 0.1)' },
                          width: 32,
                          height: 32,
                        }}
                      >
                        <Plus size={14} />
                      </IconButton>
                    </Box>

                    {/* Delete Button - Right */}
                    <IconButton
                      onClick={() => removeFromCart(item.id)}
                      color="error"
                      sx={{
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' },
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </Box>
                {index < items.length - 1 && <Divider />}
              </Box>
            ))}
          </Paper>
        </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ borderRadius: 2, p: 2, border: '1px solid', borderColor: 'divider', position: { md: 'sticky' }, top: { md: 16 } }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}>Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography variant="body2">{formatCurrency(totalPrice)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2" color="text.secondary">Shipping</Typography><Typography variant="body2" color="success.main">Free</Typography></Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography variant="subtitle1" fontWeight={600}>Total</Typography><Typography variant="subtitle1" fontWeight={600} color="primary.main">{formatCurrency(totalPrice)}</Typography></Box>
              <Button variant="contained" fullWidth onClick={handleCheckout} disabled={processing || items.length === 0} sx={{ py: 1.25, borderRadius: 2, fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
                {processing ? <CircularProgress size={22} color="inherit" /> : 'Checkout'}
              </Button>
              <Button variant="outlined" fullWidth onClick={handleContinueShopping} sx={{ mt: 1, py: 1, borderRadius: 2, textTransform: 'none' }}>Continue shopping</Button>
              {items.length > 0 && <Button variant="text" size="small" onClick={clearCart} fullWidth color="error" sx={{ mt: 0.5 }}>Clear cart</Button>}
            </Paper>
          </Grid>
        </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: { xs: 80, sm: 24 }, // Account for bottom nav on mobile
          },
        }}
      />
      </Container>
    </Box>
  );
};

export default Cart;
