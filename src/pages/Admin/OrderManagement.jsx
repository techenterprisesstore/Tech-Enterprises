import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, Chip, Button, Select, MenuItem,
  FormControl, InputLabel, Grid, IconButton, Menu, TextField,
  InputAdornment, Avatar, Divider, Tooltip,
} from '@mui/material';
import {
  MoreVertical, Search, Trash2, Package, MapPin, Calendar,
  ArrowUp, ArrowDown, Filter, Phone, FileText, Mail, Tag,
  ShoppingBag, Truck, CheckCircle, Clock, XCircle, RefreshCw,
  User, CreditCard,
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { generateOrderReceiptPdf } from '../../utils/receiptPdf';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { CircularProgress } from '@mui/material';

/* ─── Status configuration ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', icon: Clock, textColor: '#92400e' },
  confirmed: { label: 'Confirmed', color: '#3b82f6', bg: '#eff6ff', icon: CheckCircle, textColor: '#1e40af' },
  processing: { label: 'Processing', color: '#8b5cf6', bg: '#f5f3ff', icon: RefreshCw, textColor: '#5b21b6' },
  shipped: { label: 'Shipped', color: '#06b6d4', bg: '#ecfeff', icon: Truck, textColor: '#0e7490' },
  delivered: { label: 'Delivered', color: '#10b981', bg: '#ecfdf5', icon: CheckCircle, textColor: '#065f46' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', icon: XCircle, textColor: '#991b1b' },
  refunded: { label: 'Refunded', color: '#6b7280', bg: '#f9fafb', icon: RefreshCw, textColor: '#374151' },
};

const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;

/* ─── Status pill ───────────────────────────────────────────────────────────── */
const StatusPill = ({ status }) => {
  const cfg = getStatus(status);
  const Icon = cfg.icon;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      bgcolor: cfg.bg, color: cfg.textColor, border: `1px solid ${cfg.color}30`,
      borderRadius: 20, px: 1.25, py: 0.25, fontWeight: 700, fontSize: '0.7rem',
      letterSpacing: '0.04em', textTransform: 'uppercase'
    }}>
      <Icon size={12} strokeWidth={2.5} />
      {cfg.label}
    </Box>
  );
};

/* ─── Pricing row helper ────────────────────────────────────────────────────── */
const PriceRow = ({ label, value, bold, green, red, large }) => (
  <Box sx={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    py: large ? 1 : 0.6
  }}>
    <Typography variant={large ? 'subtitle2' : 'caption'} color={bold ? 'text.primary' : 'text.secondary'}
      fontWeight={bold ? 700 : 400}>
      {label}
    </Typography>
    <Typography variant={large ? 'subtitle1' : 'caption'}
      sx={{ fontWeight: large ? 700 : 500, color: green ? '#16a34a' : red ? '#dc2626' : bold ? '#0f172a' : '#475569' }}>
      {value}
    </Typography>
  </Box>
);

/* ─── Single Order Card ─────────────────────────────────────────────────────── */
const OrderCard = ({ order, onStatusChange, onDelete, updating, generatingPdfId, onGeneratePdf }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const cfg = getStatus(order.status);
  const displayName = (() => {
    const isPlaceholder = (v) => !v || String(v).trim().toLowerCase() === 'customer';
    return (!isPlaceholder(order.userName) && order.userName)
      || (!isPlaceholder(order.shippingAddress?.name) && order.shippingAddress?.name)
      || (order.userEmail ? order.userEmail.split('@')[0] : '')
      || 'Customer';
  })();
  const initial = displayName.trim()[0]?.toUpperCase() || '?';

  // Pricing breakdown
  const discountAmount = Number(order.discountAmount) || 0;
  const finalTotal = Number(order.totalPrice) || 0;
  const subtotal = discountAmount > 0 ? finalTotal + discountAmount : finalTotal;
  const couponCode = order.appliedCouponCode;

  // Items subtotal (product prices sum, before coupon)
  const itemsSubtotal = (order.items || []).reduce((sum, item) => {
    const price = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
    return sum + (price || 0) * (item.quantity || 1);
  }, 0);

  const addr = order.shippingAddress;

  return (
    <Paper elevation={0} sx={{
      mb: 2.5, borderRadius: 3,
      border: `1px solid ${cfg.color}30`,
      overflow: 'hidden', bgcolor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    }}>

      {/* ── Header ── */}
      <Box sx={{
        px: 2.5, py: 1.75,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
        background: `linear-gradient(135deg, ${cfg.bg} 0%, #fff 60%)`,
        borderBottom: `1px solid ${cfg.color}20`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            bgcolor: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingBag size={18} style={{ color: cfg.color }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.04em' }}>
                #{order.id ? order.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}
              </Typography>
              <StatusPill status={order.status} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              <Calendar size={11} style={{ color: '#94a3b8' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(order.createdAt)}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
              <Typography variant="caption" color="text.secondary">
                {order.totalItems || (order.items?.length) || 0} item{(order.totalItems || 1) !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={order.status || 'pending'}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              disabled={updating}
              size="small"
              sx={{ borderRadius: 2, height: 34, fontSize: '0.8rem', bgcolor: '#fff' }}
            >
              {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                <MenuItem key={val} value={val} sx={{ fontSize: '0.82rem' }}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Download receipt">
            <Button size="small" variant="outlined"
              startIcon={generatingPdfId === order.id ? <CircularProgress size={14} /> : <FileText size={14} />}
              onClick={() => onGeneratePdf(order)}
              disabled={generatingPdfId === order.id}
              sx={{
                borderRadius: 2, textTransform: 'none', fontSize: '0.78rem', height: 34, px: 1.5,
                borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#6366f1', color: '#6366f1' }
              }}>
              Receipt
            </Button>
          </Tooltip>
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, p: 0.75,
              '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }
            }}>
            <MoreVertical size={15} />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
            PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' } }}>
            <MenuItem onClick={() => { onDelete(order.id); setMenuAnchor(null); }}
              sx={{ color: '#ef4444', fontSize: '0.85rem', gap: 1 }}>
              <Trash2 size={15} /> Delete order
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2.5}>

          {/* Items */}
          <Grid item xs={12} lg={5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <Package size={15} style={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Items ordered
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(order.items || []).map((item, idx) => {
                const unitPrice = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
                return (
                  <Box key={idx} sx={{
                    display: 'flex', gap: 1.5, p: 1.25,
                    bgcolor: '#f8fafc', borderRadius: 2,
                    border: '1px solid #e2e8f0',
                  }}>
                    <Box component="img" src={item.imageUrl || '/placeholder.svg'} alt={item.name}
                      onError={(e) => { e.target.src = '/placeholder.svg'; }}
                      sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#fff', flexShrink: 0, border: '1px solid #e2e8f0' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a', lineHeight: 1.3, mb: 0.25 }}
                        title={item.name}>
                        {item.name?.length > 55 ? item.name.slice(0, 55) + '…' : item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty {item.quantity || 1} × {formatCurrency(unitPrice)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#6366f1', flexShrink: 0 }}>
                      {formatCurrency(unitPrice * (item.quantity || 1))}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          {/* Customer & Shipping */}
          <Grid item xs={12} sm={6} lg={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <User size={15} style={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer & Shipping
              </Typography>
            </Box>

            {/* Customer block */}
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366f1', fontSize: '0.9rem', fontWeight: 700 }}>
                  {initial}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>{displayName}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Customer</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 1, borderColor: '#e2e8f0' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Mail size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {order.userEmail || '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Phone size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary">
                    {order.userPhone || addr?.phone || '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Shipping address block */}
            {addr && (
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <MapPin size={13} style={{ color: '#6366f1' }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Delivery address
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.6 }}>
                  {addr.name && <><strong style={{ color: '#334155' }}>{addr.name}</strong><br /></>}
                  {addr.street && <>{addr.street}{addr.landmark ? `, ${addr.landmark}` : ''}<br /></>}
                  {addr.city && <>{addr.city}, {addr.state} — {addr.pincode}</>}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Pricing summary */}
          <Grid item xs={12} sm={6} lg={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <CreditCard size={15} style={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pricing
              </Typography>
            </Box>
            <Box sx={{ p: 1.75, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <PriceRow label="Items subtotal" value={formatCurrency(itemsSubtotal)} />
              {discountAmount > 0 && (
                <>
                  <PriceRow label="Product offers" value={discountAmount > 0 && itemsSubtotal !== subtotal
                    ? `−${formatCurrency(itemsSubtotal - subtotal)}` : 'None'} green />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.6 }}>
                    <Tag size={11} style={{ color: '#0369a1' }} />
                    <Typography variant="caption" sx={{ color: '#0369a1', flex: 1 }}>
                      Coupon {couponCode && <strong>{couponCode}</strong>}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                      −{formatCurrency(discountAmount)}
                    </Typography>
                  </Box>
                </>
              )}
              <PriceRow label="Shipping" value="FREE" green />
              <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
              <PriceRow label="Order total" value={formatCurrency(finalTotal)} bold large />
              <Box sx={{ mt: 1, px: 1, py: 0.5, bgcolor: '#f0fdf4', borderRadius: 1.5, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, fontSize: '0.68rem' }}>
                  💳 Cash on Delivery
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

/* ─── Summary stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color }) => (
  <Paper elevation={0} sx={{
    p: 1.75, borderRadius: 2.5, border: '1px solid #e2e8f0',
    textAlign: 'center', bgcolor: '#fff', flex: 1, minWidth: 90,
  }}>
    <Typography variant="h6" fontWeight={700} sx={{ color, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{label}</Typography>
  </Paper>
);

/* ─── Main page ─────────────────────────────────────────────────────────────── */
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    let filtered = [...orders];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.userName?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.shippingAddress?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    filtered.sort((a, b) => {
      let av = sortBy === 'createdAt' ? new Date(a[sortBy]) : a[sortBy];
      let bv = sortBy === 'createdAt' ? new Date(b[sortBy]) : b[sortBy];
      return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadOrders = async () => {
    setLoading(true);
    const result = await getAllOrders();
    if (result.success) setOrders(result.orders);
    setLoading(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(u => ({ ...u, [orderId]: true }));
    await updateOrderStatus(orderId, newStatus);
    await loadOrders();
    setUpdating(u => ({ ...u, [orderId]: false }));
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return;
    setUpdating(u => ({ ...u, [orderId]: true }));
    await deleteOrder(orderId);
    await loadOrders();
    setUpdating(u => ({ ...u, [orderId]: false }));
  };

  const handleGeneratePdf = async (order) => {
    setGeneratingPdfId(order.id);
    try { await generateOrderReceiptPdf(order); } finally { setGeneratingPdfId(null); }
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  // Stats
  const stats = Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({
    val, label: cfg.label, color: cfg.color,
    count: orders.filter(o => (o.status || 'pending') === val).length,
  })).filter(s => s.count > 0);

  if (loading) return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>

          {/* Page title */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Admin
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#0f172a' }}>Orders</Typography>
            <Typography variant="body2" color="text.secondary">Manage and track all customer orders</Typography>
          </Box>

          {/* Stats strip */}
          {stats.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
              <StatCard label="Total" value={orders.length} color="#6366f1" />
              {stats.map(s => <StatCard key={s.val} label={s.label} value={s.count} color={s.color} />)}
            </Box>
          )}

          {/* Filters bar */}
          <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField fullWidth size="small" placeholder="Search by order ID, customer name or email…"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} style={{ color: '#94a3b8' }} /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status filter</InputLabel>
                  <Select value={statusFilter} label="Status filter"
                    onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                    <MenuItem value="all">All statuses</MenuItem>
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <MenuItem key={val} value={val}>{cfg.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                  {[{ field: 'createdAt', label: 'Date' }, { field: 'totalPrice', label: 'Amount' }, { field: 'status', label: 'Status' }].map(s => (
                    <Button key={s.field} size="small" onClick={() => handleSort(s.field)}
                      startIcon={sortBy === s.field ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <Filter size={14} />}
                      sx={{
                        textTransform: 'none', borderRadius: 2, fontSize: '0.8rem',
                        bgcolor: sortBy === s.field ? '#eef2ff' : '#f8fafc',
                        color: sortBy === s.field ? '#4f46e5' : '#64748b',
                        border: '1px solid', borderColor: sortBy === s.field ? '#c7d2fe' : '#e2e8f0'
                      }}>
                      {s.label}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Order count row */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
            </Typography>
          </Box>

          {/* Orders */}
          {filteredOrders.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #e2e8f0', bgcolor: '#fff' }}>
              <Package size={48} style={{ color: '#cbd5e1', marginBottom: 16 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {orders.length === 0 ? 'Orders will appear here when customers place them.' : 'Try adjusting your search or status filter.'}
              </Typography>
            </Paper>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteOrder}
                updating={!!updating[order.id]}
                generatingPdfId={generatingPdfId}
                onGeneratePdf={handleGeneratePdf}
              />
            ))
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default OrderManagement;
