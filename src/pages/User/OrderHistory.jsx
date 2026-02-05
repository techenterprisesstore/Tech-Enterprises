import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Package, ShoppingBag, MoreVertical, X, FileText } from 'lucide-react';
import { getUserOrders, updateOrderStatus } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/format';
import { generateOrderReceiptPdf } from '../../utils/receiptPdf';
import { useAuth } from '../../hooks/useAuth';
import EmptyState from '../../components/Common/EmptyState';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import HeroIcon from '../../components/Common/HeroIcon';
import { CircularProgress } from '@mui/material';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  // User can only see and update certain statuses
  const userStatusOptions = [
    { value: 'pending', label: 'Pending', color: '#f59e0b' },
    { value: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { value: 'processing', label: 'Processing', color: '#8b5cf6' },
    { value: 'shipped', label: 'Shipped', color: '#06b6d4' },
    { value: 'delivered', label: 'Delivered', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
    { value: 'refunded', label: 'Refunded', color: '#6b7280' }
  ];

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    const result = await getUserOrders(user.uid);
    
    if (result.success) {
      setOrders(result.orders);
    }
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating({ ...updating, [orderId]: true });
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      await loadOrders();
    }
    setUpdating({ ...updating, [orderId]: false });
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async () => {
    if (selectedOrder) {
      await handleStatusChange(selectedOrder.id, 'cancelled');
      handleMenuClose();
    }
  };

  // Check if user can cancel this order
  const canCancelOrder = (order) => {
    return order.status === 'pending' || order.status === 'confirmed';
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const statusColor = (status) =>
    status === 'delivered' ? '#10b981' : status === 'confirmed' ? '#3b82f6' : status === 'processing' ? '#8b5cf6'
      : status === 'shipped' ? '#06b6d4' : status === 'cancelled' ? '#ef4444' : status === 'refunded' ? '#6b7280' : '#f59e0b';

  return (
    <ProtectedRoute>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 4 }}>
        <Container maxWidth="md" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Account
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#0f172a', mt: 0.5, letterSpacing: '-0.02em' }}>
              My orders
            </Typography>
          </Box>

          {orders.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                bgcolor: '#fff',
                borderRadius: 3,
                border: '1px dashed',
                borderColor: 'divider',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <ShoppingBag size={32} style={{ color: '#94a3b8' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#334155', mb: 1 }}>
                No orders yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 320, mx: 'auto' }}>
                Your order history will appear here once you start shopping
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {orders.map((order) => (
                <Paper
                  key={order.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    border: '1px solid',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderColor: '#cbd5e1' },
                  }}
                >
                  {/* Order header */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      bgcolor: '#fafbfc',
                      borderBottom: '1px solid',
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: '#6366f1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                        }}
                      >
                        <Package size={20} style={{ color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                          #{order.id ? order.id.substring(0, 8).toUpperCase() : '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                          {formatDate(order.createdAt)} · {order.totalItems || 0} items
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={(order.status || 'pending').toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: statusColor(order.status),
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          letterSpacing: '0.04em',
                          height: 26,
                          borderRadius: 1.5,
                        }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={generatingPdfId === order.id ? <CircularProgress size={14} /> : <FileText size={14} />}
                        onClick={async () => {
                          setGeneratingPdfId(order.id);
                          try {
                            await generateOrderReceiptPdf(order);
                          } finally {
                            setGeneratingPdfId(null);
                          }
                        }}
                        disabled={generatingPdfId === order.id}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#6366f1', color: '#6366f1', '&:hover': { borderColor: '#4f46e5', bgcolor: '#eef2ff' } }}
                      >
                        Receipt
                      </Button>
                      {canCancelOrder(order) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => handleMenuClick(e, order)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: '#f87171',
                            color: '#dc2626',
                            fontWeight: 600,
                            '&:hover': { borderColor: '#ef4444', bgcolor: '#fef2f2' },
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, order)}
                        sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedOrder?.id === order.id} onClose={handleMenuClose}>
                        {canCancelOrder(order) && (
                          <MenuItem onClick={handleCancelOrder} sx={{ color: '#dc2626', fontWeight: 500 }}>
                            <X size={16} style={{ marginRight: 10 }} />
                            Cancel order
                          </MenuItem>
                        )}
                        <MenuItem disabled>
                          <Typography variant="body2" color="text.secondary">
                            Status: {(order.status || 'pending')}
                          </Typography>
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>

                  {/* Items */}
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569', letterSpacing: '0.02em' }}>
                      Items ({order.totalItems || 0})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {order.items?.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#f8fafc',
                            border: '1px solid',
                            borderColor: '#f1f5f9',
                          }}
                        >
                          <Box
                            component="img"
                            src={item.imageUrl || '/placeholder.svg'}
                            alt={item.name}
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2,
                              objectFit: 'cover',
                              bgcolor: '#fff',
                              border: '1px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                            onError={(e) => { e.target.src = '/placeholder.svg'; }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                color: '#0f172a',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.35,
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', mt: 0.25 }}>
                              Qty {item.quantity || 1}
                              {item.isOffer && item.offerPrice ? (
                                <> · <Typography component="span" sx={{ textDecoration: 'line-through', color: '#94a3b8' }}>{formatCurrency(item.price)}</Typography> {formatCurrency(item.offerPrice)}</>
                              ) : (
                                <> · {formatCurrency(item.price)}</>
                              )}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={700} sx={{ color: '#6366f1', flexShrink: 0 }}>
                            {formatCurrency((item.isOffer && item.offerPrice ? item.offerPrice : item.price) * (item.quantity || 1))}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Total */}
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: '#fafbfc',
                      borderTop: '1px solid',
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#475569' }}>
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#6366f1' }}>
                      {formatCurrency(order.totalPrice || 0)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default OrderHistory;
