import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Grid, Paper, Box, Chip, Alert, Button, Avatar } from '@mui/material';
import { Package, User, UserCheckIcon } from 'lucide-react';
import HeroIcon from '../../components/Common/HeroIcon';
import { getAllOrders } from '../../services/orderService';
import { getAllUsers } from '../../services/userService';
import { getProducts } from '../../services/productService';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { CircularProgress } from '@mui/material';

function getOrderItemImage(item) {
  const paths = [
    item?.imageUrl,
    item?.image,
    item?.product?.imageUrl,
    item?.product?.image,
  ];
  const src = paths.find((p) => p && String(p).trim());
  if (src && !src.startsWith('http') && !src.startsWith('/')) return `/uploads/${src}`;
  return src || '/placeholder.svg';
}

const statusColor = (status) => {
  const map = { delivered: '#10b981', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', cancelled: '#ef4444', refunded: '#6b7280' };
  return map[status] || '#f59e0b';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalProducts: 0, totalRevenue: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        getAllUsers(),
        getAllOrders(),
        getProducts(100),
      ]);
      const usersList = usersRes.success ? usersRes.users : [];
      const ordersList = ordersRes.success ? ordersRes.orders : [];
      const products = productsRes.success ? (productsRes.products || []) : [];
      if (!productsRes.success) setError(productsRes.error || 'Failed to load products');
      const totalRevenue = ordersList.reduce((s, o) => s + (o.status === 'confirmed' ? (o.totalPrice || 0) : 0), 0);
      setOrders(ordersList);
      setUsers(usersList);
      setStats({
        totalUsers: usersList.length,
        totalOrders: ordersList.length,
        totalProducts: products.length,
        totalRevenue,
        pendingOrders: ordersList.filter((o) => o.status === 'pending').length,
      });
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const intervalId = setInterval(loadStats, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadStats();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const StatCard = ({ title, value, iconName, color = 'primary', onClick }) => (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}.main`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HeroIcon name={iconName} size={24} sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>{loading ? '—' : value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </Box>
    </Paper>
  );

  const ordersByNewest = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const recentOrders = ordersByNewest.slice(0, 5);
  // Recent customers = recently registered users (getAllUsers is already ordered by createdAt desc)
  const recentCustomers = users.slice(0, 5).map((u) => ({
    userName: u.name || (u.email ? u.email.split('@')[0] : '—'),
    userEmail: u.email || '—',
    createdAt: u.createdAt,
  }));

  return (
    <ProtectedRoute requireAdmin>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Admin</Typography>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Dashboard</Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} action={<Button size="small" onClick={loadStats}>Retry</Button>}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <StatCard title="Total Users" value={stats.totalUsers} iconName="people" color="primary" onClick={() => navigate('/admin/users')} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <StatCard title="Total Products" value={stats.totalProducts} iconName="inventory" color="info" onClick={() => navigate('/admin/products')} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <StatCard title="Total Orders" value={stats.totalOrders} iconName="shoppingBag" color="success" onClick={() => navigate('/admin/orders')} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} iconName="money" color="warning" />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexShrink: 0 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><Package size={20} style={{ color: 'white' }} /></Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>Recent orders</Typography>
                        <Typography variant="caption" color="text.secondary">Latest 5</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                      {recentOrders.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No orders yet</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {recentOrders.map((order) => (
                            <Box
                              key={order.id}
                              onClick={() => navigate('/admin/orders')}
                              sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: '#fafafa',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#f5f5f5' },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" fontWeight={600}>#{order.id?.slice(0, 8).toUpperCase() || '—'}</Typography>
                                <Chip label={(order.status || 'pending').toUpperCase()} size="small" sx={{ bgcolor: statusColor(order.status), color: 'white', fontSize: '0.65rem', height: 20 }} />
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block">{order.shippingAddress?.name || order.userName}</Typography>
                              {order.items?.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <Box component="img" src={getOrderItemImage(order.items[0])} alt="" onError={(e) => { e.target.src = '/placeholder.svg'; }} sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover', bgcolor: '#eee' }} />
                                  <Typography variant="caption" noWrap sx={{ flex: 1 }}>{order.items[0].name || order.items[0].product?.name || 'Item'}</Typography>
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary">{formatDateTime(order.createdAt)}</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(order.totalPrice || 0)}</Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexShrink: 0 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}><User size={20} style={{ color: 'white' }} /></Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>Recent customers</Typography>
                        <Typography variant="caption" color="text.secondary">Recently registered</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                      {recentCustomers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No customers yet</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {recentCustomers.map((c, i) => (
                            <Box key={c.userEmail || i} sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <UserCheckIcon sx={{ width: 20, height: 20 }}></UserCheckIcon><Typography variant="body2" fontWeight={600}>{c.userName || '—'}</Typography>
                              <Typography variant="caption" color="text.secondary" display="block">{c.userEmail}</Typography>
                              {c.createdAt && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>Joined {formatDate(c.createdAt)}</Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HeroIcon name="pending" size={22} sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={700}>{stats.pendingOrders}</Typography>
                      <Typography variant="body2" color="text.secondary">Pending orders</Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} onClick={() => navigate('/admin/products')} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HeroIcon name="inventory" size={22} sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>Manage products</Typography>
                      <Typography variant="caption" color="text.secondary">Add or edit products</Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} onClick={() => navigate('/admin/orders')} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HeroIcon name="shoppingBag" size={22} sx={{ color: 'white' }} />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>View orders</Typography>
                      <Typography variant="caption" color="text.secondary">Update status</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
