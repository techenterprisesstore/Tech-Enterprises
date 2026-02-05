import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
  TextField,
} from '@mui/material';
import { MapPin, Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import HeroIcon from '../../components/Common/HeroIcon';
import { logout, updateUserProfile } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import { getUserAddresses, deleteAddress, setDefaultAddress } from '../../services/addressService';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, loading: authLoading, refetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || user?.phoneNumber || '';

  useEffect(() => {
    setEditName(displayName);
    setEditPhone(displayPhone || '');
  }, [displayName, displayPhone]);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate('/login');
  };

  const loadAddresses = async () => {
    if (!user?.uid) return;
    try {
      setAddressesLoading(true);
      const userAddresses = await getUserAddresses(user.uid);
      setAddresses(userAddresses || []);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load addresses', severity: 'error' });
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user?.uid]);

  // Refetch addresses when user returns to profile (e.g. after editing on Checkout) so we always show the latest saved addresses
  useEffect(() => {
    if (location.pathname !== '/profile' || !user?.uid) return;
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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const res = await updateUserProfile(user.uid, { name: editName.trim(), phone: editPhone.trim() });
    if (res.success) {
      await refetchProfile();
      setSnackbar({ open: true, message: 'Profile updated', severity: 'success' });
      setEditingProfile(false);
    } else {
      setSnackbar({ open: true, message: res.error || 'Update failed', severity: 'error' });
    }
    setSavingProfile(false);
  };

  const handleCancelEdit = () => {
    setEditName(displayName);
    setEditPhone(displayPhone || '');
    setEditingProfile(false);
  };

  const handleDeleteAddress = async (addressId) => {
    if (addresses.length <= 1) {
      setSnackbar({ open: true, message: 'Keep at least one address', severity: 'error' });
      return;
    }
    try {
      await deleteAddress(user.uid, addressId);
      setAddresses(addresses.filter((a) => a.id !== addressId));
      setSnackbar({ open: true, message: 'Address removed', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(user.uid, addressId);
      await loadAddresses();
      setSnackbar({ open: true, message: 'Default address updated', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to update', severity: 'error' });
    }
  };

  if (authLoading) {
    return (
      <ProtectedRoute>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  return (
    <ProtectedRoute>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 10 }}>
        <Container maxWidth="sm" disableGutters sx={{ px: 2, py: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 22, fontWeight: 600 }}>
              {(displayName || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={600} noWrap>
                {editingProfile ? 'Edit profile' : displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {displayEmail}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip label={profile?.role === 'admin' ? 'Admin' : 'User'} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: profile?.role === 'admin' ? 'error.main' : 'primary.main', color: 'white', borderRadius: 1 }} />
                <Chip label={profile?.provider === 'google' ? 'Google' : 'Email'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', borderRadius: 1 }} />
              </Box>
            </Box>
            {!editingProfile && (
              <IconButton onClick={() => setEditingProfile(true)} sx={{ color: 'primary.main' }} size="small" title="Edit profile">
                <Edit2 size={18} />
              </IconButton>
            )}
          </Box>

          {/* Account – view / edit */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>
              Account
            </Typography>
            <Box sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              {editingProfile ? (
                <Box sx={{ p: 2 }}>
                  <TextField
                    label="Name"
                    size="small"
                    fullWidth
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                  <TextField
                    label="Phone"
                    size="small"
                    fullWidth
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Optional"
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<X size={16} />} onClick={handleCancelEdit} sx={{ borderRadius: 1.5 }}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" startIcon={<Check size={16} />} onClick={handleSaveProfile} disabled={savingProfile} sx={{ borderRadius: 1.5, boxShadow: 'none' }}>
                      {savingProfile ? 'Saving…' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Row label="Full name" value={displayName} />
                  <Row label="Email" value={displayEmail} />
                  <Row label="Phone" value={displayPhone || 'Not set'} />
                  <Row label="Role" value={profile?.role === 'admin' ? 'Administrator' : 'Standard user'} last />
                </>
              )}
            </Box>
          </Box>

          {/* Addresses */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Addresses
              </Typography>
              <Button size="small" startIcon={<Plus size={14} />} onClick={() => navigate('/checkout')} sx={{ color: 'primary.main', textTransform: 'none', fontWeight: 500, minWidth: 0, p: 0.5 }}>
                Add
              </Button>
            </Box>
            {addressesLoading ? (
              <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : addresses.length === 0 ? (
              <Box sx={{ py: 3, textAlign: 'center', bgcolor: 'white', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <MapPin size={28} style={{ color: '#9ca3af', marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>No saved addresses</Typography>
                <Button size="small" variant="outlined" onClick={() => navigate('/checkout')} sx={{ borderRadius: 1.5, textTransform: 'none' }}>
                  Add address
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {addresses.map((address) => (
                  <Box
                    key={address.id}
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: address.isDefault ? 'primary.main' : 'divider',
                      position: 'relative',
                    }}
                  >
                    {address.isDefault && (
                      <Chip label="Default" size="small" sx={{ position: 'absolute', top: 8, right: 8, height: 20, fontSize: '0.65rem', bgcolor: 'primary.main', color: 'white', borderRadius: 1 }} />
                    )}
                    <Typography variant="body2" fontWeight={600} sx={{ pr: 5 }}>{address.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{address.phone}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{address.street}, {address.city}, {address.state} – {address.pincode}</Typography>
                    {address.landmark && <Typography variant="caption" color="text.secondary" display="block">Landmark: {address.landmark}</Typography>}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
                      {!address.isDefault && (
                        <IconButton size="small" onClick={() => handleSetDefaultAddress(address.id)} sx={{ color: 'text.secondary', p: 0.5 }} title="Set default">
                          <MapPin size={14} />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => navigate('/checkout')} sx={{ color: 'text.secondary', p: 0.5 }} title="Edit address">
                        <Edit2 size={14} />
                      </IconButton>
                      {addresses.length > 1 && (
                        <IconButton size="small" onClick={() => handleDeleteAddress(address.id)} sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'error.main' } }} title="Delete">
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {profile?.role === 'admin' && (
              <Button fullWidth variant="contained" startIcon={<HeroIcon name="dashboard" size={18} />} onClick={() => navigate('/admin')} sx={{ py: 1.25, borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
                Admin dashboard
              </Button>
            )}
            <Button fullWidth variant="outlined" color="error" startIcon={<HeroIcon name="logout" size={18} />} onClick={handleLogout} disabled={loading} sx={{ py: 1.25, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              {loading ? 'Logging out…' : 'Log out'}
            </Button>
          </Box>
        </Container>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} message={snackbar.message} />
      </Box>
    </ProtectedRoute>
  );
};

function Row({ label, value, last }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.5,
        borderBottom: last ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right', maxWidth: '60%' }} noWrap>{value || '—'}</Typography>
    </Box>
  );
}

export default Profile;
