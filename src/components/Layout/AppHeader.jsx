import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  InputBase,
  IconButton,
  Paper,
  Typography,
  Badge,
  Popper,
  ClickAwayListener,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import HeroIcon from '../Common/HeroIcon';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { searchProducts } from '../../services/productService';
import { formatCurrency } from '../../utils/format';
import TopBar from './TopBar';

const SEARCH_DEBOUNCE_MS = 300;

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRefDesktop = useRef(null);
  const anchorRefMobile = useRef(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const runSearch = useCallback(async (term) => {
    const trimmed = (term || '').trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const result = await searchProducts(trimmed);
    if (result.success) {
      setSearchResults(result.products || []);
    } else {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(searchQuery);
      setDropdownOpen(true);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleCloseDropdown = () => {
    setDropdownOpen(false);
  };

  const handleSelectProduct = (id) => {
    navigate(`/product/${id}`);
    setSearchQuery('');
    setDropdownOpen(false);
  };

  return (
    <>
      <TopBar />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        {/* Desktop Layout */}
        <Toolbar
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 1.5,
            minHeight: 'auto !important',
            display: { xs: 'none', sm: 'flex' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Logo - Left */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/assets/primarylogo.png"
              alt="Tech Enterprise Logo"
              sx={{
                height: { xs: 32, sm: 40 },
                width: 'auto',
              }}
              onError={(e) => {
                e.target.src = '/assets/applogo.png';
              }}
            />
          </Box>

          {/* Search Bar - Center (constrained so dropdown never overlaps right icons) */}
          <ClickAwayListener onClickAway={handleCloseDropdown}>
            <Box
              ref={anchorRefDesktop}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                maxWidth: { xs: '100%', sm: 360, md: 380 },
                minWidth: 0,
                mx: { xs: 1, sm: 2 },
                position: 'relative',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: dropdownOpen ? 'primary.main' : 'divider',
                  px: 2,
                  py: 0.875,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: dropdownOpen ? '0 0 0 2px rgba(46, 75, 247, 0.12)' : 'none',
                }}
              >
                <HeroIcon name="search" size={22} color="text.secondary" sx={{ mr: 1.5, flexShrink: 0 }} />
                <InputBase
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setDropdownOpen(true)}
                  sx={{
                    flex: 1,
                    fontSize: '0.9375rem',
                    '& input': {
                      py: 0.5,
                    },
                  }}
                />
                {searchLoading && (
                  <CircularProgress size={20} sx={{ ml: 1, color: 'text.secondary' }} />
                )}
              </Paper>

              <Popper
                open={dropdownOpen && searchQuery.trim().length > 0 && isDesktop}
                anchorEl={anchorRefDesktop.current}
                placement="bottom-start"
                style={{
                  zIndex: 1300,
                  width: anchorRefDesktop.current ? Math.min(anchorRefDesktop.current.offsetWidth, 380) : 380,
                  maxWidth: 'calc(100vw - 120px)',
                }}
                modifiers={[
                  { name: 'offset', options: { offset: [0, 4] } },
                  { name: 'flip', enabled: false },
                  { name: 'preventOverflow', enabled: true, options: { padding: 8 } },
                ]}
              >
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    maxHeight: 280,
                    minWidth: 280,
                    width: '100%',
                    maxWidth: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {searchLoading ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : searchResults.length === 0 ? (
                    <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No products found for "{searchQuery}"
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ py: 0.5, maxHeight: 240, overflowY: 'auto', overflowX: 'hidden' }}>
                      {searchResults.map((product) => {
                        const offerPrice = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
                        const price = Number(product.price);
                        const hasOffer = product.isOffer === true || (offerPrice != null && offerPrice > 0 && price > offerPrice);
                        const displayPrice = hasOffer ? offerPrice : price;
                        const desc = product.description
                          ? product.description.replace(/<[^>]+>/g, '').trim().slice(0, 65)
                          : '';
                        return (
                          <Box
                            key={product.id}
                            onClick={() => handleSelectProduct(product.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              px: 2,
                              py: 1.25,
                              cursor: 'pointer',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-of-type': { borderBottom: 0 },
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                bgcolor: 'background.default',
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                component="img"
                                src={product.imageUrl || '/placeholder.svg'}
                                alt={product.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                                onError={(e) => {
                                  e.target.src = '/placeholder.svg';
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                              >
                                {product.name}
                              </Typography>
                              {desc ? (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    color: 'text.secondary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mt: 0.25,
                                  }}
                                >
                                  {desc}{desc.length >= 65 ? '…' : ''}
                                </Typography>
                              ) : null}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                {product.category || 'Product'} · {formatCurrency(displayPrice)}
                                {hasOffer && price > offerPrice ? ` (was ${formatCurrency(price)})` : ''}
                              </Typography>
                            </Box>
                            <HeroIcon name="arrowRight" size={18} color="text.secondary" sx={{ flexShrink: 0 }} />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>

          {/* Right Icons - Account, Offers, Order, Cart */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            <IconButton
              sx={{
                color: 'text.primary',
                p: { xs: 0.75, sm: 1 },
              }}
              onClick={() => navigate(user ? '/profile' : '/login')}
              title={user ? 'Account' : 'Login'}
            >
              <HeroIcon name="person" size={{ xs: 22, sm: 24 }} />
            </IconButton>

            <IconButton
              sx={{
                color: 'text.primary',
                p: { xs: 0.75, sm: 1 },
              }}
              onClick={() => navigate('/offers')}
              title="Offers"
            >
              <HeroIcon name="offer" size={{ xs: 22, sm: 24 }} />
            </IconButton>

            {user && (
              <IconButton
                sx={{
                  color: 'text.primary',
                  p: { xs: 0.75, sm: 1 },
                }}
                onClick={() => navigate('/orders')}
                title="Orders"
              >
                <HeroIcon name="receipt" size={{ xs: 22, sm: 24 }} />
              </IconButton>
            )}

            <IconButton
              sx={{
                color: 'text.primary',
                p: { xs: 0.75, sm: 1 },
              }}
              onClick={() => navigate('/cart')}
              title="Cart"
            >
              <Badge badgeContent={getCartItemCount()} color="error">
                <HeroIcon name="shoppingCart" size={{ xs: 22, sm: 24 }} />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>

        {/* Mobile Layout - Header with centered logo */}
        <Toolbar
          sx={{
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 4,
            minHeight: 'auto !important',
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Logo - Centered */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: 5,
            }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src="/assets/primarylogo.png"
              alt="Tech Enterprise Logo"
              sx={{
                height: 36,
                width: 'auto',
              }}
              onError={(e) => {
                e.target.src = '/assets/applogo.png';
              }}
            />
          </Box>

          {/* Left Icons - Account & Order (Removed for mobile to prevent overlapping) */}

          {/* Right Icon - Cart (Removed - moved to bottom navigation) */}
        </Toolbar>

        {/* Mobile Search Bar - Below Header */}
        <Box
          sx={{
            display: { xs: 'block', sm: 'none' },
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ClickAwayListener onClickAway={handleCloseDropdown}>
            <Box
              ref={anchorRefMobile}
              sx={{
                position: 'relative',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: dropdownOpen ? 'primary.main' : 'divider',
                  px: 2,
                  py: 0.875,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: dropdownOpen ? '0 0 0 2px rgba(46, 75, 247, 0.12)' : 'none',
                }}
              >
                <HeroIcon name="search" size={22} color="text.secondary" sx={{ mr: 1.5, flexShrink: 0 }} />
                <InputBase
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setDropdownOpen(true)}
                  sx={{
                    flex: 1,
                    fontSize: '0.9375rem',
                    '& input': {
                      py: 0.5,
                    },
                  }}
                />
                {searchLoading && (
                  <CircularProgress size={20} sx={{ ml: 1, color: 'text.secondary' }} />
                )}
              </Paper>

              <Popper
                open={dropdownOpen && searchQuery.trim().length > 0 && !isDesktop}
                anchorEl={anchorRefMobile.current}
                placement="bottom-start"
                style={{
                  zIndex: 1300,
                  width: anchorRefMobile.current ? anchorRefMobile.current.offsetWidth : undefined,
                  maxWidth: 'calc(100vw - 24px)',
                  minWidth: anchorRefMobile.current ? anchorRefMobile.current.offsetWidth : undefined,
                }}
                modifiers={[
                  { name: 'offset', options: { offset: [0, 4] } },
                  { name: 'flip', enabled: true },
                  { name: 'preventOverflow', enabled: true, options: { padding: 8 } },
                ]}
              >
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    maxHeight: 280,
                    minWidth: 280,
                    width: '100%',
                    maxWidth: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {searchLoading ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : searchResults.length === 0 ? (
                    <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No products found for "{searchQuery}"
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ py: 0.5, maxHeight: 240, overflowY: 'auto', overflowX: 'hidden' }}>
                      {searchResults.map((product) => {
                        const offerPrice = product.offerPrice != null && product.offerPrice !== '' ? Number(product.offerPrice) : null;
                        const price = Number(product.price);
                        const hasOffer = product.isOffer === true || (offerPrice != null && offerPrice > 0 && price > offerPrice);
                        const displayPrice = hasOffer ? offerPrice : price;
                        const desc = product.description
                          ? product.description.replace(/<[^>]+>/g, '').trim().slice(0, 65)
                          : '';
                        return (
                          <Box
                            key={product.id}
                            onClick={() => handleSelectProduct(product.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              px: 2,
                              py: 1.25,
                              cursor: 'pointer',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:last-of-type': { borderBottom: 0 },
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                bgcolor: 'background.default',
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                component="img"
                                src={product.imageUrl || '/placeholder.svg'}
                                alt={product.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                }}
                                onError={(e) => {
                                  e.target.src = '/placeholder.svg';
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                              >
                                {product.name}
                              </Typography>
                              {desc ? (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    color: 'text.secondary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    mt: 0.25,
                                  }}
                                >
                                  {desc}{desc.length >= 65 ? '…' : ''}
                                </Typography>
                              ) : null}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                {product.category || 'Product'} · {formatCurrency(displayPrice)}
                                {hasOffer && price > offerPrice ? ` (was ${formatCurrency(price)})` : ''}
                              </Typography>
                            </Box>
                            <HeroIcon name="arrowRight" size={18} color="text.secondary" sx={{ flexShrink: 0 }} />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>
        </Box>
      </AppBar>
    </>
  );
};

export default AppHeader;
