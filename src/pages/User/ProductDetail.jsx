import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  IconButton,
  Rating,
  Divider,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Snackbar,
  Fab
} from '@mui/material';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import HeroIcon from '../../components/Common/HeroIcon';
import { useCart } from '../../context/CartContext';
import { getProductById, getProducts } from '../../services/productService';
import { createOrder } from '../../services/orderService';
import { getUserRatingForProduct, submitRating, getRatingsByProduct } from '../../services/ratingService';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product?.id && product?.category) {
      loadRelatedProducts();
    }
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (product?.id && user?.uid) {
      getUserRatingForProduct(product.id, user.uid).then((res) => {
        if (res.success && res.rating != null) {
          setUserRating(res.rating);
          setReviewText(res.reviewText || '');
        }
      });
    } else if (!user) {
      setUserRating(0);
      setReviewText('');
    }
  }, [product?.id, user?.uid]);

  const loadProductReviews = async () => {
    if (!product?.id) return;
    const result = await getRatingsByProduct(product.id);
    if (result.success) setProductReviews(result.reviews || []);
  };

  useEffect(() => {
    loadProductReviews();
  }, [product?.id]);

  const loadRelatedProducts = async () => {
    try {
      const result = await getProducts();
      if (result.success && result.products) {
        // Filter related products (same category, excluding current product)
        const related = result.products
          .filter(p => p.id !== id && p.category === product?.category)
          .slice(0, 8);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  const loadProduct = async () => {
    if (!id) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await getProductById(id);
      
      if (result.success && result.product) {
        setProduct(result.product);
        // Load related products after product is loaded
        loadRelatedProducts();
      } else {
        setError(result.error || 'Product not found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      setError('Product is out of stock');
      return;
    }

    if (quantity > product.stock) {
      setError(`Only ${product.stock} units available`);
      return;
    }

    setProcessing(true);
    setError('');

    // Add item to cart first
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice,
      isOffer: product.isOffer,
      quantity: quantity,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock
    };

    const success = await addToCart(cartItem, quantity);
    
    if (success) {
      // Navigate to checkout
      navigate('/checkout');
    } else {
      setError('Failed to add item to cart');
    }
    
    setProcessing(false);
  };

  const handleRatingSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (userRating === 0) {
      setSnackbar({ open: true, message: 'Please select a rating' });
      return;
    }
    setRatingLoading(true);
    const result = await submitRating({
      productId: product.id,
      productName: product.name,
      userId: user.uid,
      userName: user.displayName || profile?.name || '',
      userEmail: user.email || '',
      rating: userRating,
      reviewText: reviewText.trim(),
    });
    setRatingLoading(false);
    if (result.success) {
      setSnackbar({ open: true, message: 'Thank you for your rating!' });
      loadProduct();
      loadProductReviews();
    } else {
      setSnackbar({ open: true, message: result.error || 'Failed to submit rating', severity: 'error' });
    }
  };

  const handleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsWishlisted(!isWishlisted);
    setSnackbar({ 
      open: true, 
      message: isWishlisted ? 'Removed from wishlist' : 'Added to wishlist' 
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this amazing product: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSnackbar({ open: true, message: 'Link copied to clipboard!' });
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!product || product.stock === 0) {
      setSnackbar({ open: true, message: 'Product is out of stock', severity: 'error' });
      return;
    }

    const success = addToCart(product, quantity);
    if (success) {
      // Reset quantity after successful addition
      setQuantity(1);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        <Container sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            Go Back Home
          </Button>
        </Container>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
        <Container sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>Product not found</Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            Go Back Home
          </Button>
        </Container>
      </Box>
    );
  }

  const hasOffer = product.isOffer && product.offerPrice;
  const hasRealReviews =
    typeof product.rating === 'number' &&
    product.rating >= 0 &&
    typeof product.totalReviews === 'number' &&
    product.totalReviews > 0;
  const averageRating = hasRealReviews ? product.rating : 0;
  const totalReviews = hasRealReviews ? product.totalReviews : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 }, py: 2 }}>
        <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="body2" color="text.secondary">Home</Typography>
          </Link>
          <Typography variant="body2" color="text.secondary">{product.category}</Typography>
          <Typography variant="body2" color="text.primary" fontWeight={500}>{product.name}</Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2 }, py: 2, pb: 4 }}>

        <Grid container spacing={4}>
          {/* Left column – sticky on desktop so it stays in view while right scrolls */}
          <Grid item xs={12} md={6} sx={{ position: { md: 'sticky' }, top: { md: 80 }, alignSelf: { md: 'flex-start' } }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  bgcolor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(() => {
                  const images = (product.galleryImages && product.galleryImages.length > 0)
                    ? product.galleryImages
                    : (product.imageUrl ? [product.imageUrl] : []);
                  const mainSrc = images[selectedImage] || product.imageUrl || '/placeholder.svg';
                  return (
                    <>
                      <Box
                        component="img"
                        src={mainSrc}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                        onError={(e) => { e.target.src = '/placeholder.svg'; }}
                      />
                      
                      {/* Image Navigation */}
                      {images.length > 1 && (
                        <>
                          <IconButton
                            onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                            sx={{
                              position: 'absolute',
                              left: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'white' },
                            }}
                          >
                            <ChevronLeft size={20} />
                          </IconButton>
                          <IconButton
                            onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))}
                            sx={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'white' },
                            }}
                          >
                            <ChevronRight size={20} />
                          </IconButton>
                        </>
                      )}
                    </>
                  );
                })()}
              </Box>
              
              {/* Thumbnail Gallery */}
              {(() => {
                const images = (product.galleryImages && product.galleryImages.length > 0)
                  ? product.galleryImages
                  : (product.imageUrl ? [product.imageUrl] : []);
                if (images.length <= 1) return null;
                
                return (
                  <Box sx={{ p: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
                    {images.map((img, index) => (
                      <Paper
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        sx={{
                          minWidth: 60,
                          height: 60,
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: selectedImage === index ? 2 : 1,
                          borderColor: selectedImage === index ? 'primary.main' : 'divider',
                          opacity: selectedImage === index ? 1 : 0.7,
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <Box
                          component="img"
                          src={img || '/placeholder.svg'}
                          alt={`${product.name} ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => { e.target.src = '/placeholder.svg'; }}
                        />
                      </Paper>
                    ))}
                  </Box>
                );
              })()}
            </Paper>
            
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'white', mt: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 1,
                  alignItems: 'stretch',
                  flexWrap: 'nowrap',
                }}
              >
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleBuy}
                  disabled={product.stock === 0 || processing}
                  startIcon={<ShoppingCart size={18} />}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    py: { xs: 1, sm: 1.25 },
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                  }}
                >
                  {processing ? 'Processing…' : 'Buy now'}
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || processing}
                  startIcon={<ShoppingCart size={18} />}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    py: { xs: 1, sm: 1.25 },
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                  }}
                >
                  Add to cart
                </Button>
                <IconButton
                  onClick={handleShare}
                  sx={{
                    flexShrink: 0,
                    width: { xs: 44, sm: 48 },
                    height: 'auto',
                    minWidth: { xs: 44, sm: 48 },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    alignSelf: 'stretch',
                  }}
                >
                  <Share2 size={18} />
                </IconButton>
              </Box>
            </Paper>

            {/* Product reviews */}
            <Paper id="product-reviews" elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'white', mt: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
                Product reviews
              </Typography>
              {productReviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet. Be the first to rate and review this product.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {productReviews.map((review) => (
                    <Box
                      key={review.id}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-of-type': { borderBottom: 0, pb: 0 },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        {(review.userName || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                          {review.userName}
                        </Typography>
                        <Rating value={review.rating} readOnly size="small" precision={0.5} sx={{ mt: 0.25, '& .MuiRating-iconFilled': { color: '#ffc107' } }} />
                        {review.reviewText && (
                          <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                            {review.reviewText}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right column – scrollable on desktop */}
          <Grid item xs={12} md={6}>
            <Box sx={{ maxHeight: { md: 'calc(100vh - 120px)' }, overflowY: { md: 'auto' }, pr: { md: 0.5 } }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white', mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                {product.name}
              </Typography>

              {/* Rating and Reviews – only when real reviews exist; click scrolls to review section */}
              {hasRealReviews && (
                <Box
                  onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 3,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating
                      value={averageRating}
                      readOnly
                      precision={0.1}
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#ffc107',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {averageRating.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#999' }}>
                    ({totalReviews} reviews)
                  </Typography>
                </Box>
              )}

              {/* Price */}
              <Box sx={{ mb: 3 }}>
                {hasOffer ? (
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: 'primary.main',
                      }}
                    >
                      {formatCurrency(product.offerPrice)}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        textDecoration: 'line-through',
                        color: '#999',
                        fontWeight: 400,
                      }}
                    >
                      {formatCurrency(product.price)}
                    </Typography>
                    <Chip
                      label={`${Math.round(((product.price - product.offerPrice) / product.price) * 100)}% OFF`}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                ) : (
                  <Typography variant="h3" fontWeight={700} sx={{ color: 'primary.main' }}>
                    {formatCurrency(product.price)}
                  </Typography>
                )}
              </Box>

              {/* Stock Status */}
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                  color={product.stock > 0 ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: 'text.secondary' }}>
                  Quantity
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconButton
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    size="small"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Minus size={18} />
                  </IconButton>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1));
                      setQuantity(val);
                    }}
                    inputProps={{ min: 1, max: product.stock }}
                    sx={{
                      width: 80,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        textAlign: 'center',
                        fontWeight: 600,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    sx={{
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      color: 'primary.main',
                      bgcolor: 'rgba(46, 75, 247, 0.1)',
                      '&:hover': { 
                        borderColor: 'primary.dark',
                        bgcolor: 'rgba(46, 75, 247, 0.2)',
                      },
                      '&:disabled': { 
                        border: '2px solid #e0e0e0',
                        color: '#999',
                        bgcolor: 'transparent',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Plus size={18} />
                  </IconButton>
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>

            
            {/* Delivery Info */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                mb: 3,
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a1a' }}>
                Why Shop With Us?
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(46, 75, 247, 0.15)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Truck size={24} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#1a1a1a' }}>
                      Free Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      On orders above $50 • Fast shipping
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(46, 75, 247, 0.15)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield size={24} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#1a1a1a' }}>
                      100% Secure Payment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SSL encrypted • Safe transactions
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(46, 75, 247, 0.15)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <RefreshCw size={24} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#1a1a1a' }}>
                      30 Days Return
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Easy returns • Full refund
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(46, 75, 247, 0.15)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Star size={24} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#1a1a1a' }}>
                      Best Quality
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Premium products • Quality assured
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* About this item – product description (after Why Shop With Us?) */}
            {product.description && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'white',
                  mb: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: 'text.primary', fontSize: '1.125rem' }}>
                  About this item
                </Typography>
                <Box
                  sx={{
                    fontSize: '1rem',
                    lineHeight: 1.65,
                    color: 'text.primary',
                    fontWeight: 400,
                    fontFamily: 'inherit',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    '& ul': { pl: 2.5, my: 1.25 },
                    '& li': { mb: 0.75, fontSize: '1rem', lineHeight: 1.65 },
                    '& p': { margin: '0.5em 0', fontSize: '1rem', lineHeight: 1.65 },
                    '& a': { color: 'primary.main', textDecoration: 'underline' },
                    '& strong': { fontWeight: 600 },
                  }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </Paper>
            )}

            {/* User Rating Section */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'white',
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: '#1a1a1a' }}>
                Rate This Product
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Rating
                  value={userRating}
                  onChange={(event, newValue) => setUserRating(newValue)}
                  onChangeActive={(event, newHoverValue) => setHoverRating(newHoverValue)}
                  precision={1}
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: 'primary.main',
                    },
                    '& .MuiRating-iconHover': {
                      color: 'primary.main',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {hoverRating > 0 ? hoverRating : userRating > 0 ? userRating : 'Click to rate'}
                </Typography>
              </Box>
              <TextField
                label="Tell something about this product (optional)"
                placeholder="Share your experience..."
                multiline
                minRows={2}
                maxRows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                onClick={handleRatingSubmit}
                disabled={userRating === 0 || ratingLoading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  bgcolor: 'transparent',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(46, 75, 247, 0.1)',
                  },
                  '&:disabled': {
                    borderColor: '#e0e0e0',
                    color: '#999',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {ratingLoading ? 'Submitting…' : 'Submit Rating'}
              </Button>
            </Paper>
            </Box>
          </Grid>
        </Grid>

        {/* Related Products Section */}
        <Box sx={{ mt: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a' }}>
              You May Also Like
            </Typography>
            <Box sx={{ 
              width: 80, 
              height: 4, 
              bgcolor: 'primary.main', 
              mx: 'auto', 
              borderRadius: 2,
              mb: 2 
            }} />
            <Typography variant="body1" color="text.secondary">
              Discover similar products that match your style
            </Typography>
          </Box>
          
          {relatedProducts.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                px: 0.5,
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
                '&::-webkit-scrollbar-track': { bgcolor: 'action.hover' },
              }}
            >
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  sx={{
                    flexShrink: 0,
                    width: 260,
                    maxWidth: 260,
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: '0 12px 24px rgba(46, 75, 247, 0.15)',
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <Box sx={{ position: 'relative', aspectRatio: '1', bgcolor: '#f8f9fa' }}>
                    <CardMedia
                      component="img"
                      image={relatedProduct.imageUrl || '/placeholder.svg'}
                      alt={relatedProduct.name}
                      sx={{ objectFit: 'contain', height: '100%' }}
                    />
                    {relatedProduct.isOffer && relatedProduct.offerPrice && (
                      <Chip
                        label={`${Math.round(((relatedProduct.price - relatedProduct.offerPrice) / relatedProduct.price) * 100)}% OFF`}
                        color="error"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 0.5, color: 'text.primary', fontSize: '0.9375rem' }}>
                      {relatedProduct.name}
                    </Typography>
                    {typeof relatedProduct.rating === 'number' &&
                      relatedProduct.rating >= 0 &&
                      typeof relatedProduct.totalReviews === 'number' &&
                      relatedProduct.totalReviews > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Rating
                            value={relatedProduct.rating}
                            readOnly
                            size="small"
                            precision={0.5}
                            sx={{ '& .MuiRating-iconFilled': { color: '#ffc107' }, '& .MuiRating-icon': { fontSize: 14 } }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            ({relatedProduct.totalReviews})
                          </Typography>
                        </Box>
                      )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'primary.main', fontSize: '1rem' }}>
                        {formatCurrency(relatedProduct.isOffer && relatedProduct.offerPrice ? relatedProduct.offerPrice : relatedProduct.price)}
                      </Typography>
                      {relatedProduct.isOffer && relatedProduct.offerPrice && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          {formatCurrency(relatedProduct.price)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No related products found
              </Typography>
            </Box>
          )}
        </Box>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: { xs: 80, sm: 24 }, // Account for bottom nav on mobile
          },
        }}
      />
    </Box>
  );
};

export default ProductDetail;
