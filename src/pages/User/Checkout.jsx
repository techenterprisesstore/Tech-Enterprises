import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Grid,
  CardMedia,
  Divider,
  Snackbar,
  CircularProgress,
  IconButton,
  Radio,
  Chip,
} from '@mui/material';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CreditCard,
  Check,
  ShoppingBag,
  Navigation,
  X,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import { createOrder } from '../../services/orderService';
import { saveAddress, getUserAddresses, deleteAddress, updateAddress } from '../../services/addressService';
import { validateCouponForUser } from '../../services/offerService';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { items, totalItems, totalPrice, clearCart, loading: cartLoading } = useCart();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  // Order state
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (authLoading || cartLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    loadAddresses();
  }, [user, authLoading, cartLoading, items.length, navigate]);

  // Refetch addresses when user returns to checkout or when tab gains focus, so we always use the latest saved address
  useEffect(() => {
    if (location.pathname !== '/checkout' || !user?.uid) return;
    const refreshAddresses = () => loadAddresses();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshAddresses();
    };
    window.addEventListener('focus', refreshAddresses);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', refreshAddresses);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [location.pathname, user?.uid]);

  const loadAddresses = async () => {
    try {
      // Load user addresses from database
      const userAddresses = await getUserAddresses(user?.uid);

      if (userAddresses && userAddresses.length > 0) {
        setAddresses(userAddresses);
        // Select the default address or the first one
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        setSelectedAddress(defaultAddress.id);
      } else {
        setAddresses([]);
        setSelectedAddress('');
      }

      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
      setSelectedAddress('');
      setInitialLoading(false);
      setSnackbar({
        open: true,
        message: 'Failed to load addresses',
        severity: 'error',
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSnackbar({
        open: true,
        message: 'Geolocation is not supported by your browser',
        severity: 'error',
      });
      return;
    }

    setSnackbar({
      open: true,
      message: 'Getting your location...',
      severity: 'info',
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          const data = await response.json();

          if (data && data.locality) {
            setNewAddress({
              ...newAddress,
              street: data.streetName || data.locality || '',
              city: data.city || data.locality || '',
              state: data.principalSubdivision || '',
              pincode: data.postcode || '',
              landmark: data.locality || '',
            });

            setSnackbar({
              open: true,
              message: 'Location fetched successfully!',
              severity: 'success',
            });
          } else {
            throw new Error('Could not fetch address details');
          }
        } catch (error) {
          console.error('Error fetching address:', error);
          setSnackbar({
            open: true,
            message: 'Could not fetch address. Please enter manually.',
            severity: 'error',
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not get your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
    );
  };

  const handleEditAddress = (address) => {
    setNewAddress({
      name: address.name || '',
      phone: address.phone || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
    });
    setEditingAddressId(address.id);
    setShowAddAddress(true);
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      if (editingAddressId) {
        const addressToUpdate = {
          name: newAddress.name,
          phone: newAddress.phone,
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          landmark: newAddress.landmark || '',
          isDefault: addresses.find((a) => a.id === editingAddressId)?.isDefault ?? false,
        };
        await updateAddress(user?.uid, editingAddressId, addressToUpdate);
        setSnackbar({ open: true, message: 'Address updated successfully', severity: 'success' });
        await loadAddresses();
      } else {
        const addressToSave = {
          name: newAddress.name,
          phone: newAddress.phone,
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          landmark: newAddress.landmark || '',
          isDefault: addresses.length === 0,
        };
        await saveAddress(user?.uid, addressToSave);
        setSnackbar({ open: true, message: 'Address saved successfully', severity: 'success' });
        await loadAddresses();
      }

      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' });
      setShowAddAddress(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error('Error saving address:', error);
      setSnackbar({
        open: true,
        message: editingAddressId ? 'Failed to update address' : 'Failed to save address',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (addresses.length === 1) {
      setSnackbar({
        open: true,
        message: 'At least one address is required',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      // Delete from database
      await deleteAddress(user?.uid, addressId);

      // Update local state
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      setAddresses(updatedAddresses);

      // Update selected address if needed
      if (selectedAddress === addressId) {
        setSelectedAddress(updatedAddresses[0].id);
      }

      setSnackbar({
        open: true,
        message: 'Address deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete address',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const finalTotal = Math.max(0, totalPrice - couponDiscount);

  const handleApplyCoupon = async () => {
    const code = (couponCode || '').trim();
    if (!code) {
      setCouponError('Enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await validateCouponForUser(code, user.uid, totalPrice);
      if (result.valid) {
        setAppliedOffer(result.offer);
        setCouponDiscount(result.discount);
        setCouponError('');
      } else {
        setAppliedOffer(null);
        setCouponDiscount(0);
        setCouponError(result.error || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError(err.message || 'Could not validate coupon');
      setAppliedOffer(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setSnackbar({
        open: true,
        message: 'Please select a shipping address',
        severity: 'error',
      });
      return;
    }
    setLoading(true);

    try {
      // Get selected address
      const selectedAddr = addresses.find(addr => addr.id === selectedAddress);

      // Prepare order data (use final total after coupon)
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Customer',
        userPhone: selectedAddr.phone,
        shippingAddress: selectedAddr,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          offerPrice: item.offerPrice,
          isOffer: item.isOffer,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          category: item.category,
        })),
        totalItems,
        totalPrice: finalTotal,
        appliedCouponCode: appliedOffer?.code || null,
        discountAmount: couponDiscount || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Create order and save to database
      const result = await createOrder(orderData);

      if (result.success) {
        setOrderId(result.orderId);

        // Open WhatsApp with order details
        window.open(result.whatsappUrl, '_blank');

        // Clear cart
        clearCart();

        // Show success
        setOrderPlaced(true);
        setSnackbar({
          open: true,
          message: 'Order placed successfully! WhatsApp opened with order details.',
          severity: 'success',
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      setSnackbar({
        open: true,
        message: 'Failed to place order. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || cartLoading || initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (orderPlaced) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Check size={64} sx={{ color: 'success.main', mx: 'auto' }} />
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your order #{orderId} has been placed successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            You will receive a confirmation message on WhatsApp shortly.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/orders')}
              sx={{
                background: 'linear-gradient(135deg, #2e4bf7 0%, #1e35c4 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1e35c4 0%, #1428a3 100%)',
                },
              }}
            >
              View Orders
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#fafafa',
      py: 2
    }}>

      {/* Header */}
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
          <IconButton onClick={() => navigate('/cart')} size="small" sx={{ color: '#6b7280' }}>
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#111827', flex: 1 }}>
            Checkout
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} · {formatCurrency(Math.max(0, totalPrice - couponDiscount))}
          </Typography>
        </Box>
      </Container>

      <Container maxWidth="sm" sx={{ mt: 2, pb: 4 }}>
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {/* Delivery */}
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              Delivery
            </Typography>
            {addresses.map((address) => (
              <Box
                key={address.id}
                onClick={() => setSelectedAddress(address.id)}
                sx={{
                  py: 1.5,
                  px: 1.5,
                  mb: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: selectedAddress === address.id ? '#3b82f6' : '#e5e7eb',
                  bgcolor: selectedAddress === address.id ? '#f8fafc' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5
                }}
              >
                <Radio
                  size="small"
                  checked={selectedAddress === address.id}
                  onChange={() => setSelectedAddress(address.id)}
                  sx={{ color: '#3b82f6', mt: 0.25, p: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#111827' }}>
                    {address.name}
                    {address.isDefault && (
                      <Chip label="Default" size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: '#e0e7ff', color: '#4338ca' }} />
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>{address.phone}</Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    {address.street}, {address.city}, {address.state} - {address.pincode}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditAddress(address)}
                    sx={{ color: '#9ca3af', '&:hover': { color: '#3b82f6' }, p: 0.5 }}
                    title="Edit address"
                  >
                    <Edit2 size={14} />
                  </IconButton>
                  {addresses.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAddress(address.id)}
                      sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' }, p: 0.5 }}
                      title="Delete address"
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
            {!showAddAddress ? (
              <Button
                variant="text"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => setShowAddAddress(true)}
                sx={{ color: '#3b82f6', fontWeight: 500, mt: 0.5, px: 0 }}
              >
                Add address
              </Button>
            ) : (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>{editingAddressId ? 'Edit address' : 'New address'}</Typography>
                <Button size="small" startIcon={<Navigation size={14} />} onClick={handleUseCurrentLocation} sx={{ mb: 1.5, color: '#3b82f6' }}>Use location</Button>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}><TextField label="Name" size="small" fullWidth value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="Phone" size="small" fullWidth value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} /></Grid>
                  <Grid item xs={12}><TextField label="Street" size="small" fullWidth value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField label="City" size="small" fullWidth value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField label="State" size="small" fullWidth value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField label="PIN" size="small" fullWidth value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField label="Landmark" size="small" fullWidth value={newAddress.landmark} onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })} /></Grid>
                </Grid>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => { setShowAddAddress(false); setEditingAddressId(null); setNewAddress({ name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' }); }}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={handleAddAddress} sx={{ bgcolor: '#3b82f6' }}>{editingAddressId ? 'Update address' : 'Save'}</Button>
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: '#e5e7eb' }} />

          {/* Items */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              Items ({totalItems})
            </Typography>
            {items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 1.5, py: 1.5, borderBottom: '1px solid #f3f4f6' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6', flexShrink: 0 }}>
                  <CardMedia component="img" image={item.imageUrl || '/placeholder.svg'} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Qty {item.quantity} × {formatCurrency(item.isOffer && item.offerPrice ? item.offerPrice : item.price)}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#111827' }}>
                  {formatCurrency((item.isOffer && item.offerPrice ? item.offerPrice : item.price) * item.quantity)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderColor: '#e5e7eb' }} />

          {/* Payment */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              Payment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box
                onClick={() => setPaymentMethod('cod')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.25,
                  px: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: paymentMethod === 'cod' ? '#3b82f6' : '#e5e7eb',
                  bgcolor: paymentMethod === 'cod' ? '#f8fafc' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Radio size="small" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} sx={{ color: '#3b82f6', p: 0 }} />
                <CreditCard size={18} style={{ color: '#6b7280' }} />
                <Typography variant="body2" fontWeight={500}>Cash on Delivery (COD)</Typography>
                <Chip label="Default" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#e0e7ff', color: '#4338ca', ml: 'auto' }} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.25,
                  px: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid #e5e7eb',
                  bgcolor: '#f9fafb',
                  opacity: 0.7,
                }}
              >
                <Radio size="small" disabled sx={{ p: 0 }} />
                <CreditCard size={18} style={{ color: '#9ca3af' }} />
                <Typography variant="body2" color="text.secondary">Other payment options (Coming soon)</Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#e5e7eb' }} />

          {/* Apply coupon */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
              Coupon
            </Typography>
            {appliedOffer ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#166534' }}>{appliedOffer.code}</Typography>
                  <Typography variant="caption" color="text.secondary">−{formatCurrency(couponDiscount)} applied</Typography>
                </Box>
                <IconButton size="small" onClick={handleRemoveCoupon} sx={{ color: '#6b7280' }} title="Remove coupon">
                  <X size={18} />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  error={!!couponError}
                  helperText={couponError}
                />
                <Button
                  variant="outlined"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                >
                  {couponLoading ? <CircularProgress size={22} /> : 'Apply'}
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: '#e5e7eb' }} />

          {/* Total & CTA */}
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{formatCurrency(totalPrice)}</Typography>
            </Box>
            {couponDiscount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 500 }}>−{formatCurrency(couponDiscount)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 500 }}>FREE</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1.5, borderTop: '1px solid #e5e7eb' }}>
              <Typography variant="subtitle1" fontWeight={600}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#3b82f6' }}>{formatCurrency(finalTotal)}</Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              disabled={!selectedAddress || loading}
              onClick={handlePlaceOrder}
              sx={{
                mt: 2,
                py: 1.5,
                bgcolor: '#3b82f6',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { bgcolor: '#2563eb' },
                '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Place order'}
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: { xs: 80, sm: 24 },
          },
        }}
      />
    </Box>
  );
};

export default Checkout;
