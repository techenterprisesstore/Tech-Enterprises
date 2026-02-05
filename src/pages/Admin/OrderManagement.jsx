import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  IconButton,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Divider,
  Avatar
} from '@mui/material';
import {
  MoreVertical,
  Search,
  Delete,
  Package,
  User,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Filter,
  Phone,
  FileText
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { generateOrderReceiptPdf } from '../../utils/receiptPdf';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { CircularProgress } from '@mui/material';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'confirmed', label: 'Confirmed', color: 'info' },
    { value: 'processing', label: 'Processing', color: 'primary' },
    { value: 'shipped', label: 'Shipped', color: 'secondary' },
    { value: 'delivered', label: 'Delivered', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
    { value: 'refunded', label: 'Refunded', color: 'default' }
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const loadOrders = async () => {
    setLoading(true);
    console.log('Admin: Loading orders...');
    const result = await getAllOrders();
    console.log('Admin: Orders result:', result);
    if (result.success) {
      console.log('Admin: Setting orders:', result.orders);
      setOrders(result.orders);
    } else {
      console.error('Admin: Failed to load orders:', result.error);
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

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      setUpdating({ ...updating, [orderId]: true });
      const result = await deleteOrder(orderId);
      if (result.success) {
        await loadOrders();
      }
      setUpdating({ ...updating, [orderId]: false });
    }
  };

  const handleMenuClick = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const orderDisplayName = (order) => {
    const isPlaceholder = (v) => !v || (typeof v === 'string' && v.trim().toLowerCase() === 'customer');
    return (!isPlaceholder(order.userName) && order.userName)
      || (!isPlaceholder(order.shippingAddress?.name) && order.shippingAddress?.name)
      || (order.userEmail ? order.userEmail.split('@')[0] : '')
      || 'Customer';
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Admin</Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Orders</Typography>

          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  size="small"
                  onClick={() => handleSort('createdAt')}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: sortBy === 'createdAt' ? '#f3f4f6' : 'transparent'
                  }}
                  startIcon={sortBy === 'createdAt' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <Filter size={16} />}
                >
                  Date
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSort('totalPrice')}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: sortBy === 'totalPrice' ? '#f3f4f6' : 'transparent'
                  }}
                  startIcon={sortBy === 'totalPrice' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <Filter size={16} />}
                >
                  Amount
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSort('status')}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    bgcolor: sortBy === 'status' ? '#f3f4f6' : 'transparent'
                  }}
                  startIcon={sortBy === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <Filter size={16} />}
                >
                  Status
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredOrders.length} of {orders.length} orders
          </Typography>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>All orders</Typography>
        </Box>

        {filteredOrders.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
            <Package size={40} style={{ color: '#9ca3af', marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {orders.length === 0 ? 'Orders will appear here when customers place them' : 'Try adjusting your search or filters'}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ mt: 1 }}>
            {filteredOrders.map((order) => {
              const displayName = orderDisplayName(order);
              const initial = (displayName && displayName !== 'Customer' ? displayName.trim()[0] : (order.userEmail || '?')[0]).toUpperCase();
              return (
              <Paper key={order.id || 'unknown'} elevation={0} sx={{ mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: '#fff' }}>
                {/* Compact header row */}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ fontFamily: 'monospace', color: '#1f2937' }}>
                      #{order.id ? order.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}
                    </Typography>
                    <Chip
                      label={(order.status || 'pending').toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: order.status === 'delivered' ? '#10b981' : order.status === 'confirmed' ? '#3b82f6' : order.status === 'processing' ? '#8b5cf6' : order.status === 'shipped' ? '#06b6d4' : order.status === 'cancelled' ? '#ef4444' : order.status === 'refunded' ? '#6b7280' : '#f59e0b',
                        color: 'white', fontWeight: 600, fontSize: '0.7rem', height: 22
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(order.createdAt)} · {order.totalItems || 0} items
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updating[order.id]}
                        size="small"
                        sx={{ borderRadius: 1.5, height: 32 }}
                      >
                        {statusOptions.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                      </Select>
                    </FormControl>
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
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      Receipt
                    </Button>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, order)} sx={{ '&:hover': { bgcolor: '#f3f4f6' } }}>
                      <MoreVertical size={16} />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && selectedOrder?.id === order.id} onClose={handleMenuClose}>
                      <MenuItem onClick={() => { handleDeleteOrder(order.id); handleMenuClose(); }} sx={{ color: '#ef4444' }}>
                        <Delete size={16} style={{ marginRight: 8 }} /> Delete Order
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>

                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Package size={14} color="#6366f1" /> Order Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {order.items?.map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                            <Box component="img" src={item.imageUrl || '/placeholder.svg'} alt={item.name}
                              sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#fff' }}
                              onError={(e) => { e.target.src = '/placeholder.svg'; }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight="600" noWrap sx={{ color: '#1f2937' }}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">Qty: {item.quantity || 1} · {formatCurrency(item.isOffer && item.offerPrice ? item.offerPrice : item.price)}</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="600" color="#6366f1">
                              {formatCurrency((item.isOffer && item.offerPrice ? item.offerPrice : item.price) * (item.quantity || 1))}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <User size={14} color="#6366f1" /> Customer & shipping
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#6366f1', fontSize: '0.95rem' }}>{initial}</Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight="600" color="#1f2937">{displayName}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{order.userEmail || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Phone size={10} /> {order.userPhone || '—'}
                          </Typography>
                          {order.shippingAddress && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                              {[order.shippingAddress.name, order.shippingAddress.street, [order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary">Order total</Typography>
                    <Typography variant="h6" fontWeight="600" color="#1f2937">{formatCurrency(order.totalPrice || 0)}</Typography>
                  </Box>
                </Box>
              </Paper>
            );})}
          </Box>
        )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default OrderManagement;
